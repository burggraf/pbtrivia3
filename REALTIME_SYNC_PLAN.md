# PocketBase Realtime Synchronization Plan

## Overview

This application uses **PocketBase Realtime Subscriptions** to synchronize game state between the host, all players, and TV screens in real-time.

### How PocketBase Realtime Works

- Uses **Server-Sent Events (SSE)** for instant, push-based updates
- Fully client-side implementation - no custom server code required
- PocketBase JS SDK automatically manages SSE connection and reconnection
- Events are sent for `create`, `update`, and `delete` operations on subscribed records

### Key Benefits

- **Instant synchronization** - all clients see changes immediately (no polling delay)
- **Efficient** - fewer HTTP requests, less battery usage
- **Built-in** - native PocketBase feature with automatic reconnection
- **Static deployment** - your app remains 100% static HTML/CSS/JS

### Mobile Considerations

SSE connections can occasionally drop when mobile apps are backgrounded or minimized. We handle this with:
- **Manual reconnection logic** using visibility and online/offline events
- **State re-sync** when app becomes visible again
- **Graceful degradation** if connection is temporarily lost

## Data Architecture

### Core Principle

All clients (host, players, TV screens) synchronize by **subscribing to a single `game_state` record** that represents the current state of the live game.

### Collections

1. **`games`** - Game configuration (created during setup)
   ```
   - id
   - host_id (relation to users)
   - name
   - code (unique 6-char game code for joining)
   - min_team_size
   - max_team_size
   - time_limit_enabled
   - time_limit_seconds
   - sound_effects_enabled
   - status (enum: 'setup', 'live', 'completed', 'abandoned')
   - created_at
   - updated_at
   ```

2. **`rounds`** - Rounds within a game
   ```
   - id
   - game_id (relation to games)
   - round_number
   - title
   - num_questions
   - categories (json array)
   - created_at
   ```

3. **`round_questions`** - Specific questions selected for each round
   ```
   - id
   - round_id (relation to rounds)
   - question_id (relation to questions)
   - question_number (position in round)
   - shuffle_seed (for deterministic answer shuffling)
   - created_at
   ```

4. **`teams`** - Teams that join a game
   ```
   - id
   - game_id (relation to games)
   - name (unique per game)
   - created_at
   ```

5. **`team_members`** - Players on teams
   ```
   - id
   - team_id (relation to teams)
   - user_id (relation to users)
   - joined_at
   ```

6. **`answers`** - Team answers to questions
   ```
   - id
   - team_id (relation to teams)
   - round_question_id (relation to round_questions)
   - selected_answer (enum: 'a', 'b', 'c', 'd')
   - is_correct (boolean)
   - time_taken_ms (for tie-breaking)
   - submitted_at
   ```

7. **`game_state`** - **THE KEY SYNCHRONIZATION RECORD**
   ```
   - id
   - game_id (relation to games, unique)
   - current_slide_type (enum: 'game_intro', 'round_intro', 'question', 'show_answer', 'round_complete', 'game_complete', 'thanks')
   - current_round_id (relation to rounds, nullable)
   - current_round_question_id (relation to round_questions, nullable)
   - is_paused (boolean)
   - slide_data (json - contains any extra data needed for the current slide)
   - started_at
   - updated_at (auto-updated on every change)
   ```

8. **`used_questions`** - Tracks questions used by each host
   ```
   - id
   - host_id (relation to users)
   - question_id (relation to questions)
   - used_at
   - composite unique: (host_id, question_id)
   ```

## Synchronization Flow

### 1. Game Start

When host clicks "Start Game":

```javascript
// Create game_state record
const gameState = await pb.collection('game_state').create({
  game_id: gameId,
  current_slide_type: 'game_intro',
  is_paused: false,
  started_at: new Date()
});

// Update game status
await pb.collection('games').update(gameId, {
  status: 'live'
});

// Subscribe to game_state changes (host also subscribes for UI consistency)
await pb.collection('game_state').subscribe(gameState.id, (e) => {
  if (e.action === 'update') {
    updateUI(e.record);
  }
});
```

### 2. Players and TV Subscribe on Join/Load

When players join or TV screen loads:

```javascript
// Find the game by code
const game = await pb.collection('games').getFirstListItem(
  `code = "${gameCode}" && status = "live"`
);

// Get the game_state
const gameState = await pb.collection('game_state').getFirstListItem(
  `game_id = "${game.id}"`
);

// Subscribe to realtime updates
const unsubscribe = await pb.collection('game_state').subscribe(
  gameState.id,
  (e) => {
    if (e.action === 'update') {
      // Immediately update UI when state changes
      updateUI(e.record);
    }
  },
  {
    expand: 'current_round_id,current_round_question_id'
  }
);

// Initial UI render
updateUI(gameState);
```

### 3. Host Controls (Advancing Slides)

When host clicks "Next":

```javascript
// Determine next slide type and data
const nextSlide = calculateNextSlide(currentState);

// Update game_state - this triggers SSE event for all subscribed clients
await pb.collection('game_state').update(gameStateId, {
  current_slide_type: nextSlide.type,
  current_round_id: nextSlide.roundId,
  current_round_question_id: nextSlide.questionId,
  slide_data: nextSlide.data
});

// All subscribed clients instantly receive the update and call their callback
```

### 4. Pausing/Resuming

When host pauses:

```javascript
await pb.collection('game_state').update(gameStateId, {
  is_paused: true
});
```

All subscribed clients **instantly** receive the update event and show "PAUSED" screen:

```javascript
// In the subscription callback
if (e.record.is_paused) {
  showPausedScreen();
} else {
  hidePausedScreen();
}
```

### 5. Answer Submission

When player submits answer:

```javascript
// Create answer record (includes timestamp for tie-breaking)
const startTime = questionDisplayedAt;
const endTime = Date.now();

try {
  await pb.collection('answers').create({
    team_id: teamId,
    round_question_id: currentQuestionId,
    selected_answer: selectedAnswer,
    time_taken_ms: endTime - startTime,
    is_correct: checkAnswer(selectedAnswer, correctAnswer)
  });

  // Success - show "Your team has answered" message
  showAnsweredStatus();
} catch (error) {
  if (error.status === 400 && error.data?.team_id) {
    // Unique constraint violation - team already answered
    showMessage("Your team has already answered");
  } else {
    // Network error - retry
    retrySubmission();
  }
}
```

**Database constraint to enforce one answer per team:**
- Unique index: `(team_id, round_question_id)`

### 6. Displaying Team Answer Counts (TV)

TV screen subscribes to both `game_state` and `answers` collections:

```javascript
// Subscribe to game_state for slide changes
await pb.collection('game_state').subscribe(gameStateId, (e) => {
  if (e.action === 'update') {
    updateSlide(e.record);
  }
});

// Subscribe to ALL answer submissions for this game
await pb.collection('answers').subscribe('*', (e) => {
  if (e.action === 'create') {
    // New answer submitted - update counter
    updateAnswerCount();
  }
}, {
  filter: `round_question_id.round_id.game_id = "${gameId}"`
});

// Function to get and display current answer count
async function updateAnswerCount() {
  if (currentSlideType !== 'question') return;

  const [answerCount, teamCount] = await Promise.all([
    pb.collection('answers').getList(1, 1, {
      filter: `round_question_id = "${currentQuestionId}"`,
      fields: 'id'
    }),
    pb.collection('teams').getList(1, 1, {
      filter: `game_id = "${gameId}"`,
      fields: 'id'
    })
  ]);

  // Display: "X of Y teams have answered"
  displayAnswerCount(answerCount.totalItems, teamCount.totalItems);
}
```

### 7. Score Calculation

Scores are calculated on-demand from the `answers` collection when displaying round/game completion slides:

```javascript
async function getTeamScores(roundId) {
  // Get all answers for this round
  const answers = await pb.collection('answers').getFullList({
    filter: `round_question_id.round_id = "${roundId}"`,
    expand: 'team_id'
  });

  // Group by team and sum correct answers
  const scores = answers.reduce((acc, answer) => {
    const teamId = answer.team_id;
    if (!acc[teamId]) {
      acc[teamId] = {
        teamId: teamId,
        teamName: answer.expand.team_id.name,
        correct: 0,
        totalTime: 0
      };
    }
    if (answer.is_correct) {
      acc[teamId].correct++;
    }
    acc[teamId].totalTime += answer.time_taken_ms;
    return acc;
  }, {});

  // Sort by score (desc), then by time (asc)
  return Object.values(scores).sort((a, b) => {
    if (b.correct !== a.correct) {
      return b.correct - a.correct;
    }
    return a.totalTime - b.totalTime;
  });
}
```

## Mobile Reconnection Handling

To ensure reliability on mobile devices, implement manual reconnection logic:

```javascript
let gameStateUnsubscribe = null;

async function subscribeToGameState(gameStateId) {
  // Unsubscribe if already subscribed
  if (gameStateUnsubscribe) {
    gameStateUnsubscribe();
  }

  // Subscribe to game_state updates
  gameStateUnsubscribe = await pb.collection('game_state').subscribe(
    gameStateId,
    (e) => {
      if (e.action === 'update') {
        updateUI(e.record);
      }
    },
    {
      expand: 'current_round_id,current_round_question_id'
    }
  );
}

// Re-sync when app becomes visible (mobile users returning to app)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    try {
      // Re-fetch current state
      const gameState = await pb.collection('game_state').getOne(gameStateId, {
        expand: 'current_round_id,current_round_question_id'
      });

      // Update UI with latest state
      updateUI(gameState);

      // Resubscribe (connection may have dropped)
      await subscribeToGameState(gameStateId);
    } catch (error) {
      console.error('Re-sync error:', error);
      showConnectionError();
    }
  }
});

// Re-sync when coming back online
window.addEventListener('online', async () => {
  try {
    const gameState = await pb.collection('game_state').getOne(gameStateId, {
      expand: 'current_round_id,current_round_question_id'
    });

    updateUI(gameState);
    await subscribeToGameState(gameStateId);
    hideConnectionError();
  } catch (error) {
    console.error('Reconnect error:', error);
  }
});

// Show warning when going offline
window.addEventListener('offline', () => {
  showConnectionError('You are offline. Reconnecting...');
});

// Monitor PocketBase connection status
setInterval(() => {
  if (!pb.realtime.isConnected) {
    console.warn('Realtime connection lost, will auto-reconnect');
    showConnectionWarning();
  } else {
    hideConnectionWarning();
  }
}, 5000); // Check every 5 seconds
```

## Host Disconnection Handling

When host's browser closes/refreshes:

```javascript
// On host app beforeunload
window.addEventListener('beforeunload', async (e) => {
  // Attempt to pause game (may not complete if page closes too fast)
  try {
    await pb.collection('game_state').update(gameStateId, {
      is_paused: true
    });
  } catch (error) {
    // Best effort - may not complete
  }
});

// On host app init - check for active game
async function initHostApp() {
  const activeGame = await pb.collection('games').getFirstListItem(
    `host_id = "${pb.authStore.model.id}" && status = "live"`,
    { requestKey: null }
  ).catch(() => null);

  if (activeGame) {
    // Host has an active game - offer to resume
    const gameState = await pb.collection('game_state').getFirstListItem(
      `game_id = "${activeGame.id}"`
    );

    showResumeDialog(activeGame, gameState);
  }
}
```

**Automatic pausing on host disconnect:**

This can be implemented with a PocketBase server-side hook (optional but recommended):

```javascript
// In pb_hooks/game_host_tracking.pb.js
onRealtimeDisconnectRequest((e) => {
  // When a client disconnects, check if they're a host of an active game
  if (!e.client.get('userId')) return;

  const games = $app.findRecordsByFilter(
    'games',
    `host_id = {:userId} && status = 'live'`,
    '-created',
    1,
    0,
    { userId: e.client.get('userId') }
  );

  if (games.length > 0) {
    const game = games[0];
    const gameStates = $app.findRecordsByFilter(
      'game_state',
      `game_id = {:gameId}`,
      '',
      1,
      0,
      { gameId: game.id }
    );

    if (gameStates.length > 0) {
      const gameState = gameStates[0];
      gameState.set('is_paused', true);
      $app.save(gameState);
    }
  }
}, 'game_host_disconnect');
```

## PocketBase Collection Rules

### `game_state` collection rules:

```javascript
// List rule - players can see game_state for games they're in, hosts can see their own
listRule: "game_id.teams.team_members.user_id ?= @request.auth.id || game_id.host_id = @request.auth.id"

// View rule - same as list
viewRule: "game_id.teams.team_members.user_id ?= @request.auth.id || game_id.host_id = @request.auth.id"

// Create rule - only host can create when starting game
createRule: "game_id.host_id = @request.auth.id"

// Update rule - only host can update
updateRule: "game_id.host_id = @request.auth.id"

// Delete rule - only host can delete
deleteRule: "game_id.host_id = @request.auth.id"
```

### `answers` collection rules:

```javascript
// List rule - teams can see their own answers, host can see all for their games
listRule: "team_id.team_members.user_id ?= @request.auth.id || team_id.game_id.host_id = @request.auth.id"

// View rule - same as list
viewRule: "team_id.team_members.user_id ?= @request.auth.id || team_id.game_id.host_id = @request.auth.id"

// Create rule - only team members can submit answers
createRule: "team_id.team_members.user_id ?= @request.auth.id"

// Update/Delete - not allowed (answers are immutable)
updateRule: null
deleteRule: null
```

### `teams` collection rules:

```javascript
// List rule - anyone in the game can see teams
listRule: "game_id.teams.team_members.user_id ?= @request.auth.id || game_id.host_id = @request.auth.id"

// View rule - same as list
viewRule: "game_id.teams.team_members.user_id ?= @request.auth.id || game_id.host_id = @request.auth.id"

// Create rule - anyone can create a team for games in setup status
createRule: "game_id.status = 'setup'"

// Update/Delete - not allowed after creation
updateRule: null
deleteRule: null
```

## Connection Status UI

Show connection status to users:

```javascript
function showConnectionStatus() {
  const statusEl = document.getElementById('connection-status');

  if (!navigator.onLine) {
    statusEl.textContent = '⚠️ Offline';
    statusEl.className = 'status-offline';
  } else if (!pb.realtime.isConnected) {
    statusEl.textContent = '⚠️ Reconnecting...';
    statusEl.className = 'status-reconnecting';
  } else {
    statusEl.textContent = '✓ Connected';
    statusEl.className = 'status-connected';
  }
}

// Update status regularly
setInterval(showConnectionStatus, 2000);

// Update immediately on connection changes
window.addEventListener('online', showConnectionStatus);
window.addEventListener('offline', showConnectionStatus);
document.addEventListener('visibilitychange', showConnectionStatus);
```

## Cleanup on Game End/Exit

Unsubscribe when leaving the game:

```javascript
let subscriptions = [];

// Track all subscriptions
subscriptions.push(
  await pb.collection('game_state').subscribe(gameStateId, handleGameStateUpdate)
);
subscriptions.push(
  await pb.collection('answers').subscribe('*', handleAnswerUpdate, { filter })
);

// Cleanup function
function cleanupGame() {
  // Unsubscribe from all
  subscriptions.forEach(unsubscribe => unsubscribe());
  subscriptions = [];

  // Or unsubscribe from everything
  pb.realtime.unsubscribe();
}

// Call on game end or navigation away
window.addEventListener('beforeunload', cleanupGame);
```

## Conclusion

This plan provides a **production-ready realtime synchronization strategy** using:

- **PocketBase Realtime Subscriptions** for instant updates via SSE
- **Single source of truth** (`game_state` record)
- **Mobile-friendly reconnection logic** for reliability
- **Client-side only** - 100% static web app deployment
- **Security via PocketBase collection rules**
- **Automatic synchronization** across all clients

The implementation leverages PocketBase's built-in realtime capabilities while adding necessary reconnection handling for mobile reliability.

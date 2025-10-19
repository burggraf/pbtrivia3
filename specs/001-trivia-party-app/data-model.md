# Data Model: Multi-User Trivia Party Application

**Date**: 2025-01-19
**Based on**: Feature specification and REALTIME_SYNC_PLAN.md

## Core Entities and Relationships

### 1. Users (Authentication)

```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique, required
  password: string;              // Hashed
  name: string;                  // Display name
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Validation Rules**:
- Email: unique, valid email format
- Name: 1-50 characters, alphanumeric + spaces
- Password: minimum 8 characters

### 2. Games (Host-Created Events)

```typescript
interface Game {
  id: string;                    // UUID
  host_id: string;               // Foreign key -> Users.id
  name: string;                  // Game display name
  code: string;                  // Unique 6-character code
  status: 'setup' | 'live' | 'completed' | 'abandoned';
  min_team_size: number;         // 1-6, default 1
  max_team_size: number;         // 1-6, default 6
  time_limit_enabled: boolean;   // Optional timer
  time_limit_seconds: number;    // 10-300 seconds if enabled
  sound_effects_enabled: boolean;// Default true
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Validation Rules**:
- Name: 1-100 characters, required
- Code: /^[A-Z0-9]{6}$/ unique, auto-generated
- Min/Max team size: 1-6, min <= max
- Time limit: 10-300 seconds if enabled

### 3. Rounds (Game Structure)

```typescript
interface Round {
  id: string;                    // UUID
  game_id: string;               // Foreign key -> Games.id
  round_number: number;          // 1-based position in game
  title: string;                 // Round display name
  num_questions: number;         // Number of questions in round
  categories: string[];          // Selected categories array
  created_at: string;            // ISO timestamp
}
```

**Validation Rules**:
- Round number: positive integer, unique per game
- Title: 1-100 characters, required
- Categories: 1-10 items from predefined list
- Num questions: 1-20, reasonable limits

### 4. Questions (Static Database)

```typescript
interface Question {
  id: string;                    // UUID
  category: string;              // From 10 predefined categories
  question: string;              // Question text
  a: string;                     // Correct answer
  b: string;                     // Incorrect answer 1
  c: string;                     // Incorrect answer 2
  d: string;                     // Incorrect answer 3
  metadata: object;              // Additional data (difficulty, source)
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

**Available Categories**:
1. Arts & Literature
2. Entertainment
3. Food and Drink
4. General Knowledge
5. Geography
6. History
7. Pop Culture
8. Science
9. Sports
10. Technology

### 5. Round Questions (Selected Questions)

```typescript
interface RoundQuestion {
  id: string;                    // UUID
  round_id: string;              // Foreign key -> Rounds.id
  question_id: string;           // Foreign key -> Questions.id
  question_number: number;       // Position within round
  shuffle_seed: number;          // For deterministic answer shuffling
  created_at: string;            // ISO timestamp
}
```

**Validation Rules**:
- Round ID + Question Number: unique per round
- Shuffle seed: number for consistent sharding

### 6. Teams (Player Groups)

```typescript
interface Team {
  id: string;                    // UUID
  game_id: string;               // Foreign key -> Games.id
  name: string;                  // Team display name
  created_at: string;            // ISO timestamp
}
```

**Validation Rules**:
- Name: 1-30 characters, unique per game
- Game ID + Name: unique constraint

### 7. Team Members (Player-Team Relationships)

```typescript
interface TeamMember {
  id: string;                    // UUID
  team_id: string;               // Foreign key -> Teams.id
  user_id: string;               // Foreign key -> Users.id
  joined_at: string;             // ISO timestamp
}
```

**Validation Rules**:
- Team ID + User ID: unique constraint
- User can only join one team per game

### 8. Answers (Team Submissions)

```typescript
interface Answer {
  id: string;                    // UUID
  team_id: string;               // Foreign key -> Teams.id
  round_question_id: string;     // Foreign key -> RoundQuestions.id
  selected_answer: 'a' | 'b' | 'c' | 'd';  // ENUM
  is_correct: boolean;           // Calculated field
  time_taken_ms: number;         // For tie-breaking
  submitted_at: string;          // ISO timestamp
}
```

**Validation Rules**:
- Team ID + Round Question ID: unique constraint (one answer per team per question)
- Time taken: positive integer
- Selected answer: valid ENUM value

### 9. Game State (Real-time Synchronization)

```typescript
interface GameState {
  id: string;                    // UUID
  game_id: string;               // Foreign key -> Games.id, unique
  current_slide_type: SlideType; // ENUM
  current_round_id: string;      // Foreign key -> Rounds.id, nullable
  current_round_question_id: string; // Foreign key -> RoundQuestions.id, nullable
  is_paused: boolean;            // Pause state
  slide_data: object;            // JSON - slide-specific metadata
  started_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp (auto-updated)
}
```

**Slide Types ENUM**:
- 'game_intro': Welcome/title slide
- 'round_intro': Round announcement
- 'question': Active question
- 'show_answer': Answer reveal
- 'round_complete': Round scores
- 'game_complete': Final results
- 'thanks': Thank you slide

**Validation Rules**:
- Game ID: unique constraint (one game state per game)
- Slide type: valid ENUM value
- Pause state: boolean

### 10. Used Questions (Host History)

```typescript
interface UsedQuestion {
  id: string;                    // UUID
  host_id: string;               // Foreign key -> Users.id
  question_id: string;           // Foreign key -> Questions.id
  used_at: string;               // ISO timestamp
}
```

**Validation Rules**:
- Host ID + Question ID: unique constraint
- Prevents question reuse for same host

## Entity Relationship Diagram

```
Users (1) ──────── (∞) Games
  │                     │
  │                     ├── (1) ──── (∞) Rounds
  │                     │                │
  │                     │                ├── (1) ──── (∞) RoundQuestions ──── (∞) Questions
  │                     │                │
  │                     │                └── (∞) Answers
  │                     │
  │                     ├── (∞) Teams ──── (∞) TeamMembers ──── (∞) Users
  │                     │                │
  │                     │                └── (∞) Answers
  │                     │
  │                     └── (1) GameState
  │
  └── (∞) UsedQuestions ──── (∞) Questions
```

## State Transitions

### Game Status Flow
```
setup ──(host starts game)───► live ──(host ends game)───► completed
  │                               │
  └──(host abandons)──────────────┘───(abandoned)───►
```

### Slide Type Flow
```
game_intro ──► round_intro ──► question ──► show_answer ──► (repeat question/show_answer)
     │                              │                │
     └──────────────────────────────┘                ▼
                                           round_complete ──► (next round or game_complete)
```

### Answer Submission Flow
```
Question Displayed ──► Team Submits Answer ──► Answer Locked
        │                                            │
        ▼                                            ▼
   Timer Expires                                 Question Ends
        │                                            │
        └─────────────────────► No Answer Possible ◄─┘
```

## Data Integrity Rules

### Business Constraints
1. **One answer per team per question**: Enforced by unique constraint
2. **Team names unique per game**: Enforced by unique constraint
3. **Players in only one team per game**: Enforced by unique constraint
4. **Questions not reused for same host**: Tracked in UsedQuestions
5. **Game codes globally unique**: Auto-generated uniqueness

### Referential Integrity
1. **Cascade delete**: Dependent data removed when parent deleted
   - Rounds deleted when Game deleted
   - Team members deleted when Team deleted
   - Answers deleted when Team deleted

2. **Restrict delete**: Prevent orphaning of important data
   - Cannot delete User with active games
   - Cannot delete Question used in any game

### Performance Indexes
1. **Game State**: Primary lookup for real-time sync
2. **Answer counting**: Fast "X of Y teams answered" queries
3. **Team lookups**: Game lobby and team management
4. **Question selection**: Random selection without repetition

## Security and Access Control

### Collection Rules Summary
- **Users**: Self-access only, hosts can see players in their games
- **Games**: Host access only, players can see games they're in
- **Teams**: Game participants can see teams, host full access
- **Answers**: Teams see own answers, hosts see all in their games
- **Game State**: Host write access, participant read access

### Data Privacy
- Email addresses isolated to authentication
- No personal data in game state or answers
- Question database remains read-only for all users
- Host data isolation enforced at database level
# API Contracts: Multi-User Trivia Party Application

**Date**: 2025-01-19
**Format**: PocketBase REST API patterns

## Authentication Endpoints

### POST /api/collections/users/auth-with-password
Authenticate user with email and password.

**Request**:
```json
{
  "identity": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "pb_auth_token_string",
  "record": {
    "id": "user_uuid",
    "email": "user@example.com",
    "name": "Display Name"
  }
}
```

### POST /api/collections/users/records
Register new user account.

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "passwordConfirm": "password123",
  "name": "Display Name"
}
```

**Response**:
```json
{
  "id": "user_uuid",
  "email": "newuser@example.com",
  "name": "Display Name",
  "created": "2025-01-19T10:00:00Z"
}
```

## Game Management Endpoints

### GET /api/collections/games/records
List games (filtered by access rules).

**Query Parameters**:
- `filter`: PocketBase filter expression
- `sort`: Field and direction (e.g., "-created")
- `expand`: Related fields to include

**Response**:
```json
{
  "items": [
    {
      "id": "game_uuid",
      "name": "Trivia Night",
      "code": "GAME12",
      "status": "setup",
      "host_id": "host_uuid",
      "created": "2025-01-19T10:00:00Z"
    }
  ],
  "totalItems": 1,
  "perPage": 30,
  "totalPages": 1
}
```

### POST /api/collections/games/records
Create new game (host only).

**Request**:
```json
{
  "name": "Weekly Trivia",
  "min_team_size": 2,
  "max_team_size": 6,
  "time_limit_enabled": true,
  "time_limit_seconds": 60,
  "sound_effects_enabled": true
}
```

**Response**:
```json
{
  "id": "game_uuid",
  "name": "Weekly Trivia",
  "code": "GAME12",
  "status": "setup",
  "host_id": "host_uuid",
  "created": "2025-01-19T10:00:00Z"
}
```

### GET /api/collections/games/records/{id}
Get specific game details.

**Response**: Same structure as create response with all fields.

### PATCH /api/collections/games/records/{id}
Update game configuration (host only).

**Request**:
```json
{
  "name": "Updated Trivia Night",
  "sound_effects_enabled": false
}
```

### DELETE /api/collections/games/records/{id}
Delete game (host only).

## Round Management Endpoints

### POST /api/collections/rounds/records
Create new round (host only).

**Request**:
```json
{
  "game_id": "game_uuid",
  "round_number": 1,
  "title": "Geography Round",
  "num_questions": 10,
  "categories": ["Geography", "History"]
}
```

**Response**:
```json
{
  "id": "round_uuid",
  "game_id": "game_uuid",
  "round_number": 1,
  "title": "Geography Round",
  "num_questions": 10,
  "categories": ["Geography", "History"],
  "created": "2025-01-19T10:00:00Z"
}
```

### GET /api/collections/rounds/records
List rounds for a game.

**Query Parameters**:
- `filter`: `game_id = "game_uuid"`

## Team Management Endpoints

### POST /api/collections/teams/records
Create new team.

**Request**:
```json
{
  "game_id": "game_uuid",
  "name": "The Brainiacs"
}
```

**Response**:
```json
{
  "id": "team_uuid",
  "game_id": "game_uuid",
  "name": "The Brainiacs",
  "created": "2025-01-19T10:00:00Z"
}
```

### GET /api/collections/teams/records
List teams for a game.

**Query Parameters**:
- `filter`: `game_id = "game_uuid"`
- `expand`: `team_members(user_id)`

**Response**:
```json
{
  "items": [
    {
      "id": "team_uuid",
      "name": "The Brainiacs",
      "expand": {
        "team_members": [
          {
            "user_id": "user_uuid",
            "user_name": "Player Name"
          }
        ]
      }
    }
  ]
}
```

### POST /api/collections/team_members/records
Join team (player only).

**Request**:
```json
{
  "team_id": "team_uuid",
  "user_id": "user_uuid"
}
```

**Response**:
```json
{
  "id": "team_member_uuid",
  "team_id": "team_uuid",
  "user_id": "user_uuid",
  "joined_at": "2025-01-19T10:00:00Z"
}
```

## Question Management Endpoints

### GET /api/collections/questions/records
Get available questions.

**Query Parameters**:
- `filter`: Category and exclusion filters
- `page`: Pagination
- `perPage`: Results per page (max 100)

**Example**:
```
GET /api/collections/questions/records?filter=category='Geography'&perPage=20
```

**Response**:
```json
{
  "items": [
    {
      "id": "question_uuid",
      "category": "Geography",
      "question": "What is the capital of France?",
      "a": "Paris",
      "b": "London",
      "c": "Berlin",
      "d": "Madrid"
    }
  ],
  "totalItems": 1500
}
```

### POST /api/collections/round_questions/records
Add questions to round (host only).

**Request**:
```json
{
  "round_id": "round_uuid",
  "question_id": "question_uuid",
  "question_number": 1,
  "shuffle_seed": 12345
}
```

## Answer Submission Endpoints

### POST /api/collections/answers/records
Submit team answer.

**Request**:
```json
{
  "team_id": "team_uuid",
  "round_question_id": "round_question_uuid",
  "selected_answer": "a",
  "time_taken_ms": 15000
}
```

**Response**:
```json
{
  "id": "answer_uuid",
  "team_id": "team_uuid",
  "round_question_id": "round_question_uuid",
  "selected_answer": "a",
  "is_correct": true,
  "time_taken_ms": 15000,
  "submitted_at": "2025-01-19T10:30:15Z"
}
```

### GET /api/collections/answers/records
Get answers for scoring.

**Query Parameters**:
- `filter`: Round and team filters
- `expand`: Related data

**Example**:
```
GET /api/collections/answers/records?filter=round_question_id.round_id="round_uuid"&expand=team_id
```

## Game State Endpoints

### POST /api/collections/game_state/records
Create game state when starting game (host only).

**Request**:
```json
{
  "game_id": "game_uuid",
  "current_slide_type": "game_intro",
  "is_paused": false,
  "slide_data": {}
}
```

**Response**:
```json
{
  "id": "game_state_uuid",
  "game_id": "game_uuid",
  "current_slide_type": "game_intro",
  "is_paused": false,
  "slide_data": {},
  "started_at": "2025-01-19T10:00:00Z",
  "updated_at": "2025-01-19T10:00:00Z"
}
```

### GET /api/collections/game_state/records/{id}
Get current game state.

**Query Parameters**:
- `expand`: `current_round_id,current_round_question_id`

**Response**:
```json
{
  "id": "game_state_uuid",
  "game_id": "game_uuid",
  "current_slide_type": "question",
  "current_round_id": "round_uuid",
  "current_round_question_id": "round_question_uuid",
  "is_paused": false,
  "slide_data": {
    "question": "What is the capital of France?",
    "answers": ["Paris", "London", "Berlin", "Madrid"],
    "time_limit": 60
  },
  "started_at": "2025-01-19T10:00:00Z",
  "updated_at": "2025-01-19T10:15:30Z"
}
```

### PATCH /api/collections/game_state/records/{id}
Update game state (host only).

**Request**:
```json
{
  "current_slide_type": "show_answer",
  "is_paused": false,
  "slide_data": {
    "correct_answer": "a",
    "explanation": "Paris is the capital of France"
  }
}
```

## Real-time Subscriptions

### Subscribe to Game State
Subscribe to real-time updates for a game.

**WebSocket URL**: `wss://your-pocketbase-url/api/realtime`

**Subscription**:
```javascript
pb.collection('game_state').subscribe('game_state_uuid', (e) => {
  if (e.action === 'update') {
    // Handle game state update
    updateUI(e.record);
  }
});
```

**Event Payload**:
```json
{
  "action": "update",
  "record": {
    "id": "game_state_uuid",
    "current_slide_type": "question",
    "is_paused": false,
    "updated_at": "2025-01-19T10:15:30Z"
  }
}
```

### Subscribe to Answer Updates
Monitor answer submissions for live counting.

**Subscription**:
```javascript
pb.collection('answers').subscribe('*', (e) => {
  if (e.action === 'create') {
    // New answer submitted
    updateAnswerCount();
  }
}, {
  filter: `round_question_id.round_id.game_id = "${gameId}"`
});
```

## Error Responses

All endpoints return standard HTTP status codes with error details.

**400 Bad Request**:
```json
{
  "code": 400,
  "message": "The request data is invalid.",
  "data": {
    "team_id": {
      "code": "validation_invalid_choice",
      "message": "Invalid choice."
    }
  }
}
```

**401 Unauthorized**:
```json
{
  "code": 401,
  "message": "Missing or invalid auth token."
}
```

**403 Forbidden**:
```json
{
  "code": 403,
  "message": "You are not allowed to perform this request."
}
```

**404 Not Found**:
```json
{
  "code": 404,
  "message": "The requested resource wasn't found."
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Answer submission: 1 request per team per question
- Game state updates: 10 requests per second per host
- General queries: 100 requests per minute per user

## Client SDK Integration

**PocketBase JavaScript SDK** recommended for all client interactions:

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://your-pocketbase-url');

// Authentication
await pb.collection('users').authWithPassword(email, password);

// API calls
const games = await pb.collection('games').getList(1, 20, {
  filter: 'status = "live"',
  expand: 'host_id'
});

// Real-time subscriptions
await pb.collection('game_state').subscribe(gameStateId, callback);
```
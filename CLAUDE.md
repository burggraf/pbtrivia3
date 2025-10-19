# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-User Trivia Party Application - A real-time multiplayer trivia game designed for pub/restaurant venues. Players use mobile phones while questions and scores display on TV screens. Built as a static web application using React, PocketBase, and real-time synchronization via Server-Sent Events.

**Architecture**: Static web app (no SSR) compatible with Cloudflare Pages deployment
**Scale**: Medium venues (up to 50 players, 10 teams), single-session games (1-2 hours)
**Real-time**: PocketBase SSE with <1 second sync delay, 95% answer submission success rate

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:5173)
npm run build        # Build for production (TypeScript + Vite)
npm run preview      # Preview production build
```

### Testing (Constitution Mandate: TDD Required)
```bash
npm run test         # Run Vitest tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI interface
npm run test:coverage # Run tests with coverage report (>80% required)
npm run test:e2e     # Run E2E tests with Chrome Dev Tools MCP
```

### PocketBase Backend
```bash
./pocketbase serve --dev        # Start PocketBase in development mode
./scripts/init-pocketbase.sh    # Initialize PocketBase with migrations
./scripts/load-questions.js     # Load 61,000+ trivia questions
```

## Architecture

### Technology Stack (Constitution Compliance)
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **State Management**: Zustand (global game state) + React Context (auth)
- **Backend**: PocketBase (SQLite) with JavaScript SDK
- **Real-time**: PocketBase Server-Sent Events (SSE)
- **Testing**: Vitest + React Testing Library + MSW + Chrome Dev Tools MCP
- **Deployment**: Static site to Cloudflare Pages

### Project Structure
```
src/
├── components/           # Role-based React components
│   ├── ui/              # Base shadcn/ui components
│   ├── game/            # Shared game components (QuestionDisplay, Timer)
│   ├── host/            # Host-specific components (Controls, Setup)
│   ├── player/          # Player components (GameView, AnswerInterface)
│   └── tv/              # TV display components (BigScoreBoard, QuestionSlide)
├── pages/               # Route-level components
│   ├── host/            # Host pages (Dashboard, Game setup)
│   ├── player/          # Player pages (Join, Lobby, Game)
│   ├── tv/              # TV display pages
│   └── auth/            # Authentication pages
├── services/            # Business logic and external integrations
│   ├── pocketbase/      # PocketBase client configuration
│   ├── realtime/        # Real-time synchronization logic
│   ├── auth/            # Authentication service
│   └── sound/           # Browser-based sound effects
├── stores/              # Zustand state management
├── contexts/            # React Context providers
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── assets/              # Static assets (sounds, icons)
```

### Real-time Architecture
**PocketBase SSE Pattern**: All real-time updates use Server-Sent Events with automatic reconnection
- Game state synchronization: `pb.collection('game_state').subscribe()`
- Answer submission monitoring: `pb.collection('answers').subscribe()`
- Mobile reliability: Page visibility API + online/offline event handling
- Connection status: User feedback with graceful degradation

### Component Architecture: Role-Based Design
Separate component trees for different client types enable:
- **Host components**: Game setup, controls, management interfaces
- **Player components**: Game view, answer interface, team formation
- **TV components**: Large screen layouts, score displays, question slides
- **Shared components**: Reusable game logic (QuestionDisplay, Timer, ScoreDisplay)

### State Management Strategy
- **Zustand**: Global game state (questions, scores, teams, current game)
- **React Context**: Authentication state and UI-specific state
- **Local State**: Component-specific interactions with `useReducer` for complex flows

### Data Model (PocketBase Collections)
10 core entities with optimized relationships:
- `users` - Authentication
- `games` - Game sessions (host-controlled)
- `rounds` - Game structure with categories
- `questions` - 61,000+ static trivia questions
- `round_questions` - Selected questions with deterministic shuffling
- `teams` - Player groups
- `team_members` - Player-team relationships
- `answers` - Team submissions with timing
- `game_state` - Real-time synchronization state
- `used_questions` - Host question history

## Development Workflow (Constitution Mandate)

### Test-Driven Development (TDD) - REQUIRED
1. **Write tests FIRST** - All tests must fail before implementation (Red-Green-Refactor)
2. **Test Categories**: Unit (Vitest) → Component (RTL) → Integration (MSW) → E2E (Chrome Dev Tools MCP)
3. **Coverage Requirement**: >80% test coverage mandatory
4. **E2E Testing**: All user-facing features must be validated in browser

### Implementation Phases
**Phase 1**: Setup (completed) - Project structure, dependencies, configuration
**Phase 2**: Foundational (T011-T021) - Core services, PocketBase client, auth, real-time hooks
**Phase 3+**: User Stories (US1-US6) - Independent implementation per story

### User Story Independence
Each user story is designed for independent implementation and testing:
- **US1**: Host game creation and setup (MVP)
- **US2**: Player team formation and game joining
- **US3**: Live trivia gameplay experience
- **US4**: Host game control and flow management
- **US5**: TV display and audience experience
- **US6**: Answer timing and tie-breaking

### Critical Implementation Rules
- **Static Architecture Only**: No server-side code, no SSR
- **PocketBase SSE**: All real-time features via Server-Sent Events
- **Mobile First**: Responsive design with connection reliability
- **Sound Effects**: Browser-based only (HTML5 Audio API)
- **Single Session**: Games designed for 1-2 hour venue events

## PocketBase Integration

### Client Configuration
```typescript
// src/services/pocketbase/client.ts
import PocketBase from 'pocketbase';
export const pb = new PocketBase('http://localhost:8090');
```

### Real-time Subscriptions
```typescript
// Game state sync
pb.collection('game_state').subscribe(gameId, (e) => {
  if (e.action === 'update') handleGameStateUpdate(e.record);
});

// Answer monitoring
pb.collection('answers').subscribe('*', (e) => {
  if (e.action === 'create') updateAnswerCount();
}, { filter: `round_question_id.round_id.game_id = "${gameId}"` });
```

## Testing Strategy

### Vitest Configuration
- **Environment**: jsdom with React Testing Library
- **Mocks**: MSW for PocketBase API, Web Audio API, HTML5 Audio
- **Coverage**: @vitest/coverage-v8 with >80% threshold

### E2E Testing (Chrome Dev Tools MCP)
Browser validation required for all user-facing features:
- Host workflow: Game creation → Setup → Control
- Player workflow: Join → Team formation → Gameplay
- TV display: Real-time synchronization across all game states
- Visual appearance verification

## Constitution Compliance Check

All development must comply with these constitutional principles:
1. **Static Web Architecture**: No server-side code, Cloudflare Pages compatible
2. **TDD Compliance**: Tests written before implementation, Red-Green-Refactor enforced
3. **High Test Coverage**: >80% coverage mandatory with comprehensive testing
4. **E2E Testing**: Chrome Dev Tools MCP validation for all user-facing features
5. **Simplicity**: YAGNI principles, justified complexity only

## Quick Start

1. **Start PocketBase**: `./pocketbase serve --dev` (http://localhost:8090)
2. **Load Questions**: `./scripts/load-questions.js` (61,000+ questions)
3. **Start Dev Server**: `npm run dev` (http://localhost:5173)
4. **Run Tests**: `npm run test` (ensure TDD compliance)
5. **Check Coverage**: `npm run test:coverage` (>80% required)

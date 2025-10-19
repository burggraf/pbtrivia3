---
description: "Task list template for feature implementation"
---

# Tasks: Multi-User Trivia Party Application

**Input**: Design documents from `/specs/001-trivia-party-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are MANDATORY per Trivia Party Constitution (TDD Principle). Tests must be written before implementation and follow Red-Green-Refactor cycle using Vitest. End-to-end browser testing using Chrome Dev Tools MCP server is required for all user-facing features.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize React project with Vite and TypeScript dependencies
- [ ] T003 [P] Install and configure Tailwind CSS for styling
- [ ] T004 [P] Install and configure shadcn/ui component library
- [ ] T005 [P] Install PocketBase JS SDK for backend integration
- [ ] T006 [P] Install Zustand for state management
- [ ] T007 [P] Install Vitest testing framework with React Testing Library
- [ ] T008 [P] Install MSW for API mocking
- [ ] T009 [P] Configure ESLint and Prettier for code formatting
- [ ] T010 [P] Set up TypeScript configuration and type definitions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create PocketBase client configuration in src/services/pocketbase/client.ts
- [x] T012 [P] Create TypeScript type definitions in src/types/index.ts
- [x] T013 [P] Create authentication service in src/services/auth/authService.ts
- [x] T014 [P] Create base real-time sync hooks in src/hooks/useRealtimeSync.ts
- [x] T015 [P] Create game state store with Zustand in src/stores/gameStore.ts
- [x] T016 [P] Create authentication context provider in src/contexts/AuthContext.tsx
- [x] T017 [P] Create routing configuration with React Router in src/App.tsx
- [x] T018 [P] Set up Vitest configuration with MSW mocking in vitest.config.ts
- [x] T019 [P] Create PocketBase collection mock handlers in tests/mocks/pocketbase.ts
- [x] T020 [P] Create base error handling utilities in src/utils/errorHandling.ts
- [x] T021 [P] Create sound effects management service in src/services/sound/soundService.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Host Game Creation and Setup (Priority: P1) 🎯 MVP

**Goal**: Enable hosts to create, configure, and start trivia games

**Independent Test**: Can be fully tested by creating a game, adding rounds, selecting categories, and previewing questions without any players or live gameplay involved.

### Tests for User Story 1 (MANDATORY per Constitution) ⚠️

**NOTE: TDD Compliance Required - Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [ ] T022 [P] [US1] Unit test for game creation logic in tests/unit/services/gameCreation.test.ts
- [ ] T023 [P] [US1] Unit test for round configuration in tests/unit/services/roundConfiguration.test.ts
- [ ] T024 [P] [US1] Component test for GameSetupForm in tests/component/host/GameSetupForm.test.tsx
- [ ] T025 [P] [US1] Component test for RoundConfigurationForm in tests/component/host/RoundConfigurationForm.test.tsx
- [ ] T026 [P] [US1] Integration test for complete game setup flow in tests/integration/host/gameSetup.test.tsx
- [ ] T027 [P] [US1] E2E browser test for host game creation workflow using Chrome Dev Tools MCP

### Implementation for User Story 1

- [ ] T028 [P] [US1] Create Game model types in src/types/game.ts
- [ ] T029 [P] [US1] Create Round model types in src/types/round.ts
- [ ] T030 [P] [US1] Create Question model types in src/types/question.ts
- [ ] T031 [US1] Implement game creation service in src/services/game/gameService.ts
- [ ] T032 [P] [US1] Implement round configuration service in src/services/game/roundService.ts
- [ ] T033 [P] [US1] Implement question selection service in src/services/game/questionService.ts
- [ ] T034 [US1] Create GameSetupForm component in src/components/host/GameSetupForm.tsx
- [ ] T035 [P] [US1] Create RoundConfigurationForm component in src/components/host/RoundConfigurationForm.tsx
- [ ] T036 [P] [US1] Create QuestionPreview component in src/components/host/QuestionPreview.tsx
- [ ] T037 [P] [US1] Create GameConfigurationSummary component in src/components/host/GameConfigurationSummary.tsx
- [ ] T038 [US1] Implement host dashboard page in src/pages/host/Dashboard.tsx
- [ ] T039 [US1] Add game creation routes in src/routes/hostRoutes.tsx
- [ ] T040 [US1] Integrate game creation with authentication and game store
- [ ] T041 [US1] Add validation and error handling for game configuration
- [ ] T042 [US1] Add logging for game setup operations
- [ ] T043 [US1] Add sound effects for game setup interactions

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Player Team Formation and Game Joining (Priority: P1)

**Goal**: Enable players to create accounts, join games, and form teams

**Independent Test**: Can be fully tested by multiple players creating accounts, joining a game, and forming teams without any questions being asked.

### Tests for User Story 2 (MANDATORY per Constitution) ⚠️

- [ ] T044 [P] [US2] Unit test for player authentication in tests/unit/services/authService.test.ts
- [ ] T045 [P] [US2] Unit test for game joining logic in tests/unit/services/gameJoining.test.ts
- [ ] T046 [P] [US2] Unit test for team creation and joining in tests/unit/services/teamService.test.ts
- [ ] T047 [P] [US2] Component test for LoginForm in tests/component/auth/LoginForm.test.tsx
- [ ] T048 [P] [US2] Component test for GameJoinForm in tests/component/player/GameJoinForm.test.tsx
- [ ] T049 [P] [US2] Component test for TeamList in tests/component/player/TeamList.test.tsx
- [ ] T050 [P] [US2] Component test for TeamCreationForm in tests/component/player/TeamCreationForm.test.tsx
- [ ] T051 [P] [US2] Integration test for complete player joining flow in tests/integration/player/gameJoining.test.tsx
- [ ] T052 [P] [US2] E2E browser test for player team formation workflow using Chrome Dev Tools MCP

### Implementation for User Story 2

- [ ] T053 [P] [US2] Create User model types in src/types/user.ts
- [ ] T054 [P] [US2] Create Team model types in src/types/team.ts
- [ ] T055 [P] [US2] Create TeamMember model types in src/types/teamMember.ts
- [ ] T056 [P] [US2] Implement user authentication service in src/services/auth/userAuthService.ts
- [ ] T057 [P] [US2] Implement game joining service in src/services/player/gameJoiningService.ts
- [ ] T058 [P] [US2] Implement team management service in src/services/player/teamService.ts
- [ ] T059 [P] [US2] Create LoginForm component in src/components/auth/LoginForm.tsx
- [ ] T060 [P] [US2] Create RegisterForm component in src/components/auth/RegisterForm.tsx
- [ ] T061 [P] [US2] Create GameJoinForm component in src/components/player/GameJoinForm.tsx
- [ ] T062 [P] [US2] Create GameLobby component in src/components/player/GameLobby.tsx
- [ ] T063 [P] [US2] Create TeamList component in src/components/player/TeamList.tsx
- [ ] T064 [P] [US2] Create TeamCreationForm component in src/components/player/TeamCreationForm.tsx
- [ ] T065 [P] [US2] Create TeamJoinForm component in src/components/player/TeamJoinForm.tsx
- [ ] T066 [US2] Implement player pages routing in src/pages/player/index.tsx
- [ ] T067 [US2] Create GameJoin page in src/pages/player/Join.tsx
- [ ] T068 [US2] Create Lobby page in src/pages/player/Lobby.tsx
- [ ] T069 [US2] Add player authentication routes in src/routes/playerRoutes.tsx
- [ ] T070 [US2] Integrate player authentication with auth context and game store
- [ ] T071 [US2] Add validation and error handling for team formation
- [ ] T072 [US2] Add real-time updates for team changes in game lobby
- [ ] T073 [US2] Add sound effects for team joining and leaving
- [ ] T125 [P] [US2] Implement QR code generation service in src/services/player/qrCodeService.ts
- [ ] T126 [P] [US2] Create QRCodeDisplay component in src/components/player/QRCodeDisplay.tsx
- [ ] T127 [P] [US2] Create TVQRCodeDisplay component in src/components/tv/TVQRCodeDisplay.tsx
- [ ] T128 [P] [US2] Unit test for QR code generation in tests/unit/services/qrCode.test.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Live Trivia Gameplay Experience (Priority: P1)

**Goal**: Enable players to view questions, submit answers, and see results during live gameplay

**Independent Test**: Can be fully tested with a host, multiple teams, and a single round of questions to validate the complete question-answer-reveal flow. Real-time synchronization must follow `/REALTIME_SYNC_PLAN.md`.

### Tests for User Story 3 (MANDATORY per Constitution) ⚠️

- [ ] T074 [P] [US3] Unit test for answer submission logic in tests/unit/services/answerService.test.ts
- [ ] T075 [P] [US3] Unit test for answer shuffling algorithm in tests/unit/utils/answerShuffling.test.ts
- [ ] T076 [P] [US3] Unit test for score calculation in tests/unit/services/scoreService.test.ts
- [ ] T077 [P] [US3] Component test for QuestionDisplay in tests/component/game/QuestionDisplay.test.tsx
- [ ] T078 [P] [US3] Component test for AnswerInterface in tests/component/player/AnswerInterface.test.tsx
- [ ] T079 [P] [US3] Component test for ScoreDisplay in tests/component/game/ScoreDisplay.test.tsx
- [ ] T080 [P] [US3] Integration test for real-time gameplay flow in tests/integration/game/liveGameplay.test.tsx
- [ ] T081 [P] [US3] E2E browser test for complete trivia gameplay using Chrome Dev Tools MCP

### Implementation for User Story 3

- [ ] T082 [P] [US3] Create Answer model types in src/types/answer.ts
- [ ] T083 [P] [US3] Create GameState model types in src/types/gameState.ts
- [ ] T084 [P] [US3] Implement answer submission service in src/services/game/answerService.ts
- [ ] T085 [P] [US3] Implement score calculation service in src/services/game/scoreService.ts
- [ ] T086 [P] [US3] Implement answer shuffling utility in src/utils/answerShuffling.ts
- [ ] T087 [P] [US3] Create QuestionDisplay component in src/components/game/QuestionDisplay.tsx
- [ ] T088 [P] [US3] Create AnswerInterface component in src/components/player/AnswerInterface.tsx
- [ ] T089 [P] [US3] Create AnswerStatus component in src/components/player/AnswerStatus.tsx
- [ ] T090 [P] [US3] Create ScoreDisplay component in src/components/game/ScoreDisplay.tsx
- [ ] T091 [P] [US3] Create Timer component in src/components/game/Timer.tsx
- [ ] T092 [P] [US3] Create PlayerGameView component in src/components/player/PlayerGameView.tsx
- [ ] T093 [US3] Implement real-time game state synchronization in src/hooks/useGameState.ts
- [ ] T094 [US3] Create GamePlay page in src/pages/player/Game.tsx
- [ ] T095 [US3] Integrate gameplay with real-time sync and sound effects
- [ ] T096 [US3] Add answer timing tracking for tie-breaking
- [ ] T097 [US3] Add connection status indicators and graceful degradation
- [ ] T098 [US3] Add sound effects for answer submission and timer warnings
- [ ] T100 [US3] Implement score calculation timing logic - scores displayed only at round and game completion per FR-017
- [ ] T101 [P] [US3] Create ScoreCalculationService in src/services/game/scoreCalculationService.ts
- [ ] T102 [P] [US3] Create ScoreDisplayTiming component in src/components/game/ScoreDisplayTiming.tsx
- [ ] T103 [P] [US3] Unit test for score timing in tests/unit/services/scoreTiming.test.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Host Game Control and Flow Management (Priority: P1)

**Goal**: Enable hosts to control game progression, pause/resume, navigate slides, and manage game flow

**Independent Test**: Can be fully tested by a host navigating through a pre-configured game with all control features without player interaction. Host controls and real-time updates must follow `/REALTIME_SYNC_PLAN.md`.

### Tests for User Story 4 (MANDATORY per Constitution) ⚠️

- [ ] T099 [P] [US4] Unit test for game state management in tests/unit/services/gameStateService.test.ts
- [ ] T100 [P] [US4] Unit test for slide navigation logic in tests/unit/services/slideNavigation.test.ts
- [ ] T101 [P] [US4] Component test for HostControls in tests/component/host/HostControls.test.tsx
- [ ] T102 [P] [US4] Component test for SlideNavigation in tests/component/host/SlideNavigation.test.tsx
- [ ] T103 [P] [US4] Component test for PauseControls in tests/component/host/PauseControls.test.tsx
- [ ] T104 [P] [US4] Integration test for host control flow in tests/integration/host/gameControl.test.tsx
- [ ] T105 [P] [US4] E2E browser test for complete host game control workflow using Chrome Dev Tools MCP

### Implementation for User Story 4

- [ ] T106 [P] [US4] Implement game state management service in src/services/game/gameStateService.ts
- [ ] T107 [P] [US4] Implement slide navigation service in src/services/game/slideNavigationService.ts
- [ ] T108 [P] [US4] Implement question replacement service in src/services/game/questionReplacementService.ts
- [ ] T109 [P] [US4] Create HostControls component in src/components/host/HostControls.tsx
- [ ] T110 [P] [US4] Create SlideNavigation component in src/components/host/SlideNavigation.tsx
- [ ] T111 [P] [US4] Create PauseControls component in src/components/host/PauseControls.tsx
- [ ] T112 [P] [US4] Create QuestionManagement component in src/components/host/QuestionManagement.tsx
- [ ] T113 [P] [US4] Create GameProgressIndicator component in src/components/host/GameProgressIndicator.tsx
- [ ] T114 [P] [US4] Create HostGameView component in src/components/host/HostGameView.tsx
- [ ] T115 [US4] Create GameControl page in src/pages/host/Game.tsx
- [ ] T116 [US4] Implement real-time host controls with game state synchronization
- [ ] T117 [US4] Add navigation history and back navigation support
- [ ] T118 [US4] Add early game termination functionality
- [ ] T119 [US4] Add sound effects for slide transitions and controls
- [ ] T120 [US4] Implement single-session game duration management per FR-020
- [ ] T121 [P] [US4] Create SessionManagementService in src/services/game/sessionManagementService.ts
- [ ] T122 [P] [US4] Create SessionTimer component in src/components/host/SessionTimer.tsx
- [ ] T123 [P] [US4] Add session duration validation (1-2 hour typical venue duration)
- [ ] T124 [P] [US4] Unit test for session management in tests/unit/services/sessionManagement.test.ts

**Checkpoint**: Host control functionality should be fully operational

---

## Phase 7: User Story 5 - TV Display and Audience Experience (Priority: P2)

**Goal**: Enable TV displays to show questions, answers, team progress, and scores for audience viewing

**Independent Test**: Can be fully tested by displaying game content on a TV screen and verifying all game states are properly shown.

### Tests for User Story 5 (MANDATORY per Constitution) ⚠️

- [ ] T120 [P] [US5] Component test for TVDisplay in tests/component/tv/TVDisplay.test.tsx
- [ ] T121 [P] [US5] Component test for TVQuestionDisplay in tests/component/tv/TVQuestionDisplay.test.tsx
- [ ] T122 [P] [US5] Component test for TVScoreBoard in tests/component/tv/TVScoreBoard.test.tsx
- [ ] T123 [P] [US5] Component test for AnswerProgressIndicator in tests/component/tv/AnswerProgressIndicator.test.tsx
- [ ] T124 [P] [US5] Integration test for TV display real-time sync in tests/integration/tv/tvDisplay.test.tsx
- [ ] T125 [P] [US5] E2E browser test for TV display experience using Chrome Dev Tools MCP

### Implementation for User Story 5

- [ ] T126 [P] [US5] Create TVDisplay component in src/components/tv/TVDisplay.tsx
- [ ] T127 [P] [US5] Create TVQuestionDisplay component in src/components/tv/TVQuestionDisplay.tsx
- [ ] T128 [P] [US5] Create TVScoreBoard component in src/components/tv/TVScoreBoard.test.tsx
- [ ] T129 [P] [US5] Create AnswerProgressIndicator component in src/components/tv/AnswerProgressIndicator.tsx
- [ ] T130 [P] [US5] Create TVSlideDisplay component in src/components/tv/TVSlideDisplay.tsx
- [ ] T131 [P] [US5] Create TVWelcomeSlide component in src/components/tv/TVWelcomeSlide.tsx
- [ ] T132 [P] [US5] Create TVRoundIntro component in src/components/tv/TVRoundIntro.tsx
- [ ] T133 [P] [US5] Create TVResultsSlide component in src/components/tv/TVResultsSlide.tsx
- [ ] T134 [P] [US5] Create TV page routing in src/pages/tv/index.tsx
- [ ] T135 [US5] Create TV display page in src/pages/tv/Display.tsx
- [ ] T136 [US5] Implement TV-specific styling and large screen layouts
- [ ] T137 [US5] Integrate TV display with real-time game state synchronization
- [ ] T138 [US5] Add sound effects support for TV displays (optional)
- [ ] T139 [US5] Add QR code display for easy player joining

**Checkpoint**: TV display functionality should be fully operational

---

## Phase 8: User Story 6 - Answer Timing and Tie-breaking (Priority: P2)

**Goal**: Track answer timing for all teams and use cumulative time as tiebreaker when teams have equal scores

**Independent Test**: Can be fully tested by simulating teams with equal scores but different answer times and verifying tiebreaker logic.

### Tests for User Story 6 (MANDATORY per Constitution) ⚠️

- [ ] T140 [P] [US6] Unit test for timing tracking in tests/unit/services/timingService.test.ts
- [ ] T141 [P] [US6] Unit test for tiebreaker logic in tests/unit/services/tiebreakerService.test.ts
- [ ] T142 [P] [US6] Component test for TimerDisplay in tests/component/game/TimerDisplay.test.tsx
- [ ] T143 [P] [US6] Component test for TiebreakerDisplay in tests/component/game/TiebreakerDisplay.test.tsx
- [ ] T144 [P] [US6] Integration test for timing and tiebreaking in tests/integration/game/timingTiebreaker.test.tsx
- [ ] T145 [P] [US6] E2E browser test for tiebreaker scenarios using Chrome Dev Tools MCP

### Implementation for User Story 6

- [ ] T146 [P] [US6] Implement timing tracking service in src/services/game/timingService.ts
- [ ] T147 [P] [US6] Implement tiebreaker calculation service in src/services/game/tiebreakerService.ts
- [ ] T148 [P] [US6] Create TimerDisplay component in src/components/game/TimerDisplay.tsx
- [ ] T149 [P] [US6] Create TiebreakerDisplay component in src/components/game/TiebreakerDisplay.tsx
- [ ] T150 [P] [US6] Create AnswerTimingTracker component in src/components/game/AnswerTimingTracker.tsx
- [ ] T151 [P] [US6] Update score calculation to include timing for tie-breaking
- [ ] T152 [P] [US6] Update score displays to show tiebreaker information
- [ ] T153 [P] [US6] Add visual indicators for timing-based rankings
- [ ] T154 [P] [US6] Integrate timing with disconnection/reconnection scenarios
- [ ] T155 [P] [US6] Add sound effects for timer warnings and tiebreaker announcements

**Checkpoint**: Timing and tiebreaking functionality should be fully operational

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T156 [P] Documentation updates in docs/
- [ ] T157 Code cleanup and refactoring across all components
- [ ] T158 Performance optimization across all stories
- [ ] T159 [P] Additional unit tests for edge cases in tests/unit/
- [ ] T160 [P] Component testing for accessibility in tests/component/
- [ ] T161 Integration testing for error scenarios in tests/integration/
- [ ] T162 Security hardening and validation review
- [ ] T163 [P] Run quickstart.md validation
- [ ] T164 [P] Add comprehensive error boundaries and loading states
- [ ] T165 [P] Implement responsive design optimizations for mobile devices
- [ ] T166 [P] Add offline support and connection recovery
- [ ] T167 [P] Optimize bundle size and loading performance
- [ ] T168 [P] Add analytics and performance monitoring
- [ ] T169 [P] Create deployment configuration for Cloudflare Pages
- [ ] T170 [P] Add environment configuration management

---

## Constitution Compliance Check

Before completing any user story, verify the following constitutional requirements are met:

### Static Web Architecture
- [ ] No server-side code introduced
- [ ] All functionality works in static site constraints
- [ ] React, shadcn, Tailwind used appropriately

### TDD Compliance (Constitution Principle II)
- [ ] Tests written BEFORE implementation (Red-Green-Refactor)
- [ ] All tests pass before feature completion
- [ ] Vitest framework used correctly

### High Test Coverage (Constitution Principle III)
- [ ] >80% coverage achieved for new code
- [ ] Coverage report shows improvement
- [ ] Low coverage areas addressed

### End-to-End Testing (Constitution Principle IV)
- [ ] Chrome Dev Tools MCP server tests created
- [ ] All user-facing features validated in browser
- [ ] Visual appearance verified

### Simplicity (Constitution Principle V)
- [ ] YAGNI principles followed
- [ ] Complexity justified and documented
- [ ] No unnecessary dependencies added

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US1 → US2 → US3 → US4 → US5 → US6)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (US1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (US2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (US3)**: Can start after Foundational (Phase 2) - Depends on US1 & US2 for complete game flow
- **User Story 4 (US4)**: Can start after Foundational (Phase 2) - Depends on US1 for game setup, integrates with US3
- **User Story 5 (US5)**: Can start after Foundational (Phase 2) - Depends on US1 & US3 for game content display
- **User Story 6 (US6)**: Can start after Foundational (Phase 2) - Depends on US3 for answer submission context

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before components
- Components before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Unit test for game creation logic in tests/unit/services/gameCreation.test.ts"
Task: "Unit test for round configuration in tests/unit/services/roundConfiguration.test.ts"
Task: "Component test for GameSetupForm in tests/component/host/GameSetupForm.test.tsx"
Task: "Integration test for complete game setup flow in tests/integration/host/gameSetup.test.tsx"

# Launch all models for User Story 1 together:
Task: "Create Game model types in src/types/game.ts"
Task: "Create Round model types in src/types/round.ts"
Task: "Create Question model types in src/types/question.ts"

# Launch all services for User Story 1 together:
Task: "Implement game creation service in src/services/game/gameService.ts"
Task: "Implement round configuration service in src/services/game/roundService.ts"
Task: "Implement question selection service in src/services/game/questionService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 4 (Host-focused)
   - Developer B: User Story 2 + User Story 3 (Player-focused)
   - Developer C: User Story 5 + User Story 6 (Display & Logic)
3. Stories complete and integrate independently

---

## Constitution Compliance Check

Before completing any user story, verify the following constitutional requirements are met:

### Static Web Architecture
- [ ] No server-side code introduced
- [ ] All functionality works in static site constraints
- [ ] React, shadcn, Tailwind used appropriately

### TDD Compliance
- [ ] Tests written BEFORE implementation (Red-Green-Refactor)
- [ ] All tests pass before feature completion
- [ ] Vitest framework used correctly

### Test Coverage
- [ ] >80% coverage achieved for new code
- [ ] Coverage report shows improvement
- [ ] Low coverage areas addressed

### E2E Testing
- [ ] Chrome Dev Tools MCP server tests created
- [ ] All user-facing features validated in browser
- [ ] Visual appearance verified

### Simplicity
- [ ] YAGNI principles followed
- [ ] Complexity justified and documented
- [ ] No unnecessary dependencies added

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence



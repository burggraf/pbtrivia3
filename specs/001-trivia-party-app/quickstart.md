# Quickstart Guide: Multi-User Trivia Party Application

**Purpose**: Rapid development setup and first-time run instructions
**Target**: Developers implementing the trivia party application

## Prerequisites

### Required Tools
- **Node.js** 18+ and npm
- **PocketBase** server (binary included in repo)
- **Modern web browser** with JavaScript enabled
- **Code editor** (VS Code recommended)

### Optional Development Tools
- **Chrome Dev Tools** MCP server (for E2E testing)
- **Postman** or similar API testing tool
- **Git** for version control

## Project Setup (5 minutes)

### 1. Environment Preparation

```bash
# Clone repository (if not already done)
git clone <repository-url>
cd pbtrivia3

# Install dependencies
npm install

# Verify PocketBase binary
./pocketbase --version
```

### 2. Start PocketBase Server

```bash
# Start PocketBase in background
./pocketbase serve --dev &

# Or run in foreground for development
./pocketbase serve --dev
```

**Default URLs**:
- Admin UI: http://localhost:8090/_/
- API: http://localhost:8090/api

### 3. Initial Database Setup

```bash
# Load trivia questions (61,000+ questions)
./scripts/load-questions.sh

# Create admin user (if not exists)
./scripts/create-admin.sh

# Verify setup
curl http://localhost:8090/api/health
```

## Development Workflow

### 1. Start Development Server

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev

# Application available at: http://localhost:5173
```

### 2. PocketBase Admin Configuration

1. **Access Admin UI**: http://localhost:8090/_/
2. **Login** with admin credentials from setup
3. **Verify Collections**:
   - `users` - Authentication
   - `games` - Game management
   - `teams` - Team creation
   - `questions` - 61K+ trivia questions
   - `game_state` - Real-time synchronization

### 3. Test Application Flow

#### Host Workflow
1. Navigate to http://localhost:5173/host
2. Create account or login
3. Create new game with settings
4. Add rounds with categories
5. Preview and customize questions
6. Start game

#### Player Workflow
1. Navigate to http://localhost:5173/join
2. Enter game code from host
3. Create account or login
4. Create new team or join existing
5. Wait for game to start

#### TV Display Workflow
1. Navigate to http://localhost:5173/tv/[game-code]
2. Display shows game content
3. Follow host progression in real-time

## Key Development Patterns

### 1. State Management (Zustand)

```typescript
// src/stores/gameStore.ts
import { create } from 'zustand';

interface GameState {
  currentGame: Game | null;
  teams: Team[];
  isHost: boolean;
  // ... other state
}

const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  teams: [],
  isHost: false,
  actions: {
    setGame: (game) => set({ currentGame: game }),
    // ... other actions
  }
}));
```

### 2. PocketBase Integration

```typescript
// src/services/pocketbase/client.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://localhost:8090');

// Auto-refresh auth token
pb.authStore.onChange(() => {
  console.log('Auth state changed:', pb.authStore.isValid);
});
```

### 3. Real-time Subscriptions

```typescript
// src/hooks/useRealtimeSync.ts
export const useRealtimeSync = (gameId: string) => {
  const { actions } = useGameStore();

  useEffect(() => {
    const unsubscribe = pb.collection('game_state').subscribe(
      gameId,
      (e) => {
        if (e.action === 'update') {
          actions.handleGameStateUpdate(e.record);
        }
      }
    );

    return unsubscribe;
  }, [gameId]);
};
```

### 4. Component Architecture

```typescript
// src/components/game/QuestionDisplay.tsx
interface QuestionDisplayProps {
  question: Question;
  role: 'host' | 'player' | 'tv';
  onAnswerSelect?: (answer: string) => void;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  role,
  onAnswerSelect
}) => {
  const shuffledAnswers = useMemo(() => {
    // Deterministic shuffling
    return shuffleAnswers(question);
  }, [question]);

  return (
    <div className={`question-display question-display--${role}`}>
      <h2>{question.question}</h2>
      <div className="answers">
        {shuffledAnswers.map((answer, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect?.(answer)}
            disabled={role !== 'player'}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
};
```

## Testing Setup

### 1. Unit Tests (Vitest)

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 2. Component Tests

```typescript
// test/components/QuestionDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import { QuestionDisplay } from '@/components/game/QuestionDisplay';

test('displays question with shuffled answers', () => {
  const mockQuestion = {
    id: 'q1',
    question: 'Test question?',
    a: 'Answer A',
    b: 'Answer B',
    c: 'Answer C',
    d: 'Answer D'
  };

  render(<QuestionDisplay question={mockQuestion} role="player" />);

  expect(screen.getByText('Test question?')).toBeInTheDocument();
  expect(screen.getByText('Answer A')).toBeInTheDocument();
});
```

### 3. E2E Tests (Chrome Dev Tools MCP)

```bash
# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- game-flow.test.ts
```

## Common Development Tasks

### 1. Add New Game Feature

1. **Update Data Model**: Add fields to relevant collections
2. **Create Component**: Build React component with role-specific views
3. **Update Store**: Add state management in Zustand store
4. **Add Tests**: Write unit and component tests
5. **Update API**: Add PocketBase endpoints if needed

### 2. Debug Real-time Issues

```typescript
// Enable PocketBase debug mode
pb.debug = true;

// Monitor real-time events
pb.collection('game_state').subscribe(gameId, (e) => {
  console.log('Real-time event:', e);
}, {
  // Add detailed logging
  $autoCancel: false
});
```

### 3. Performance Optimization

```typescript
// Use React.memo for expensive components
export const QuestionDisplay = React.memo(({ question, role }) => {
  // Component implementation
});

// Use useMemo for expensive calculations
const shuffledAnswers = useMemo(() => {
  return shuffleAnswers(question);
}, [question.id]);
```

## Deployment

### 1. Build for Production

```bash
# Build static application
npm run build

# Output in dist/ directory
ls -la dist/
```

### 2. Deploy to Cloudflare Pages

```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy to Cloudflare Pages
wrangler pages deploy dist

# Or use GitHub Actions for CI/CD
git push origin main
```

### 3. Production PocketBase Setup

```bash
# Production PocketBase instance
./pocketbase serve --production

# Configure environment variables
export POCKETBASE_ENCRYPTION_KEY="your-secret-key"
export POCKETBASE_URL="https://your-domain.com"
```

## Troubleshooting

### Common Issues

**1. PocketBase connection refused**
```bash
# Check if PocketBase is running
lsof -i :8090

# Start PocketBase if needed
./pocketbase serve --dev
```

**2. Real-time subscriptions not working**
```typescript
// Check connection status
console.log('PocketBase connected:', pb.realtime.isConnected);

// Verify authentication
console.log('Authenticated:', pb.authStore.isValid);
```

**3. CORS errors**
```bash
# Check PocketBase CORS settings
# In Admin UI: Settings > CORS Domains
# Add: http://localhost:5173
```

**4. Build errors**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Debug Tools

**Browser DevTools**:
- Network tab for API calls
- Console for real-time events
- React DevTools for component state

**PocketBase Admin UI**:
- Collection browser for data inspection
- Logs for request debugging
- API console for testing queries

## Getting Help

### Documentation
- **PocketBase Docs**: https://pocketbase.io/docs/
- **React Docs**: https://react.dev/
- **Vitest Docs**: https://vitest.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs

### Repository Structure
```
src/
├── components/       # React components
├── pages/           # Route components
├── services/        # Business logic
├── hooks/           # Custom hooks
├── stores/          # Zustand stores
├── utils/           # Utilities
└── types/           # TypeScript definitions

tests/
├── unit/            # Unit tests
├── component/       # Component tests
└── e2e/             # End-to-end tests

specs/               # Feature specifications
├── spec.md          # Feature specification
├── plan.md          # Implementation plan
├── data-model.md    # Data model
├── research.md      # Research findings
└── contracts/       # API contracts
```

This quickstart guide provides everything needed to get the trivia party application running and start development. The application is designed for rapid iteration with comprehensive testing and a clear separation of concerns.
import { http, HttpResponse } from 'msw'
import type { User, Game, Team, Question, GameState } from '@/types'

// Mock data for testing
const mockUsers: User[] = [
  {
    id: 'user_1',
    email: 'host@example.com',
    name: 'Game Host',
    created_at: '2025-01-19T10:00:00Z',
    updated_at: '2025-01-19T10:00:00Z'
  },
  {
    id: 'user_2',
    email: 'player@example.com',
    name: 'Player One',
    created_at: '2025-01-19T10:01:00Z',
    updated_at: '2025-01-19T10:01:00Z'
  }
]

const mockGames: Game[] = [
  {
    id: 'game_1',
    host_id: 'user_1',
    name: 'Trivia Night',
    title: 'Trivia Night',
    description: 'A fun trivia game',
    code: 'GAME12',
    game_code: 'GAME12',
    status: 'setup',
    min_team_size: 2,
    max_team_size: 6,
    max_teams: 6,
    team_size: 4,
    round_count: 5,
    time_limit_enabled: true,
    time_limit_seconds: 60,
    sound_effects_enabled: true,
    created_at: '2025-01-19T10:00:00Z',
    updated_at: '2025-01-19T10:00:00Z'
  }
]

const mockTeams: Team[] = [
  {
    id: 'team_1',
    game_id: 'game_1',
    name: 'The Brainiacs',
    created_at: '2025-01-19T10:05:00Z'
  }
]

const mockQuestions: Question[] = [
  {
    id: 'question_1',
    category: 'General Knowledge',
    question: 'What is the capital of France?',
    a: 'Paris',
    b: 'London',
    c: 'Berlin',
    d: 'Madrid',
    metadata: { difficulty: 'easy', source: 'General Knowledge DB' },
    created_at: '2025-01-19T09:00:00Z',
    updated_at: '2025-01-19T09:00:00Z'
  }
]

const mockGameStates: GameState[] = [
  {
    id: 'game_state_1',
    game_id: 'game_1',
    current_slide_type: 'game_intro',
    current_round_id: undefined,
    current_round_question_id: undefined,
    is_paused: false,
    slide_data: {},
    started_at: '2025-01-19T10:10:00Z',
    updated_at: '2025-01-19T10:10:00Z'
  }
]

// Helper function to create PocketBase API response
const createPocketBaseResponse = <T>(data: T, meta?: any) => ({
  data,
  ...meta
})

// Helper function to create PocketBase paginated response
const createPaginatedResponse = <T>(items: T[], page = 1, perPage = 30) => ({
  items,
  totalItems: items.length,
  perPage,
  totalPages: Math.ceil(items.length / perPage),
  currentPage: page
})

// PocketBase API handlers
export const handlers = [
  // Authentication endpoints
  http.post('/api/collections/users/auth-with-password', async ({ request }) => {
    const { identity, password } = await request.json() as { identity: string; password: string }

    // Mock authentication logic
    const user = mockUsers.find(u => u.email === identity)
    if (!user || password !== 'password123') {
      return HttpResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return HttpResponse.json(
      createPocketBaseResponse({
        token: 'mock_auth_token',
        record: user
      })
    )
  }),

  http.post('/api/collections/users/records', async ({ request }) => {
    const userData = await request.json() as any

    // Check if email already exists
    if (mockUsers.some(u => u.email === userData.email)) {
      return HttpResponse.json(
        {
          data: { email: { code: 'validation_invalid_email', message: 'Email already exists' } },
          message: 'The request data is invalid.'
        },
        { status: 400 }
      )
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockUsers.push(newUser)

    return HttpResponse.json(
      createPocketBaseResponse(newUser)
    )
  }),

  // Games endpoints
  http.get('/api/collections/games/records', ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '30')

    let filteredGames = [...mockGames]

    // Apply filters
    if (filter) {
      // Simple filter implementation for common cases
      if (filter.includes('host_id')) {
        const match = filter.match(/host_id\s*=\s*["']([^"']+)["']/)
        if (match) {
          filteredGames = filteredGames.filter(g => g.host_id === match[1])
        }
      }
    }

    const paginatedResponse = createPaginatedResponse(filteredGames, page, perPage)

    return HttpResponse.json(paginatedResponse)
  }),

  http.post('/api/collections/games/records', async ({ request }) => {
    const gameData = await request.json() as any

    // Generate unique game code
    const generateGameCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const newGame: Game = {
      id: `game_${Date.now()}`,
      host_id: gameData.host_id || 'user_1',
      name: gameData.name,
      title: gameData.name,
      description: gameData.description,
      code: generateGameCode(),
      game_code: generateGameCode(),
      status: 'setup',
      min_team_size: gameData.min_team_size || 1,
      max_team_size: gameData.max_team_size || 6,
      max_teams: gameData.max_teams || 6,
      team_size: gameData.team_size || 4,
      round_count: gameData.round_count || 5,
      time_limit_enabled: gameData.time_limit_enabled || false,
      time_limit_seconds: gameData.time_limit_seconds || 60,
      sound_effects_enabled: gameData.sound_effects_enabled !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockGames.push(newGame)

    return HttpResponse.json(
      createPocketBaseResponse(newGame)
    )
  }),

  http.get('/api/collections/games/records/:id', ({ params }) => {
    const game = mockGames.find(g => g.id === params.id)

    if (!game) {
      return HttpResponse.json(
        { message: 'The requested resource wasn\'t found.' },
        { status: 404 }
      )
    }

    return HttpResponse.json(
      createPocketBaseResponse(game)
    )
  }),

  http.patch('/api/collections/games/records/:id', async ({ params, request }) => {
    const gameIndex = mockGames.findIndex(g => g.id === params.id)

    if (gameIndex === -1) {
      return HttpResponse.json(
        { message: 'The requested resource wasn\'t found.' },
        { status: 404 }
      )
    }

    const updates = await request.json() as any
    mockGames[gameIndex] = { ...mockGames[gameIndex], ...updates, updated_at: new Date().toISOString() }

    return HttpResponse.json(
      createPocketBaseResponse(mockGames[gameIndex])
    )
  }),

  // Teams endpoints
  http.get('/api/collections/teams/records', ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '30')

    let filteredTeams = [...mockTeams]

    // Apply filters
    if (filter && filter.includes('game_id')) {
      const match = filter.match(/game_id\s*=\s*["']([^"']+)["']/)
      if (match) {
        filteredTeams = filteredTeams.filter(t => t.game_id === match[1])
      }
    }

    const paginatedResponse = createPaginatedResponse(filteredTeams, page, perPage)

    return HttpResponse.json(paginatedResponse)
  }),

  http.post('/api/collections/teams/records', async ({ request }) => {
    const teamData = await request.json() as any

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      game_id: teamData.game_id,
      name: teamData.name,
      created_at: new Date().toISOString()
    }

    mockTeams.push(newTeam)

    return HttpResponse.json(
      createPocketBaseResponse(newTeam)
    )
  }),

  // Questions endpoints
  http.get('/api/collections/questions/records', ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('perPage') || '30')

    let filteredQuestions = [...mockQuestions]

    // Apply filters
    if (filter && filter.includes('category')) {
      const match = filter.match(/category\s*=\s*["']([^"']+)["']/)
      if (match) {
        filteredQuestions = filteredQuestions.filter(q => q.category === match[1])
      }
    }

    const paginatedResponse = createPaginatedResponse(filteredQuestions, page, perPage)

    return HttpResponse.json(paginatedResponse)
  }),

  // Game State endpoints
  http.get('/api/collections/game_state/records/:id', ({ params }) => {
    const gameState = mockGameStates.find(gs => gs.id === params.id)

    if (!gameState) {
      return HttpResponse.json(
        { message: 'The requested resource wasn\'t found.' },
        { status: 404 }
      )
    }

    return HttpResponse.json(
      createPocketBaseResponse(gameState)
    )
  }),

  http.post('/api/collections/game_state/records', async ({ request }) => {
    const gameStateData = await request.json() as any

    const newGameState: GameState = {
      id: `game_state_${Date.now()}`,
      game_id: gameStateData.game_id,
      current_slide_type: gameStateData.current_slide_type,
      current_round_id: gameStateData.current_round_id,
      current_round_question_id: gameStateData.current_round_question_id,
      is_paused: gameStateData.is_paused || false,
      slide_data: gameStateData.slide_data || {},
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockGameStates.push(newGameState)

    return HttpResponse.json(
      createPocketBaseResponse(newGameState)
    )
  }),

  http.patch('/api/collections/game_state/records/:id', async ({ params, request }) => {
    const gameStateIndex = mockGameStates.findIndex(gs => gs.id === params.id)

    if (gameStateIndex === -1) {
      return HttpResponse.json(
        { message: 'The requested resource wasn\'t found.' },
        { status: 404 }
      )
    }

    const updates = await request.json() as any
    mockGameStates[gameStateIndex] = {
      ...mockGameStates[gameStateIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    return HttpResponse.json(
      createPocketBaseResponse(mockGameStates[gameStateIndex])
    )
  }),

  // Health check endpoint
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  }),

  // Catch-all handler for unimplemented endpoints
  http.all('/api/*', ({ request }) => {
    console.warn(`Mock: Unhandled ${request.method} request to ${request.url}`)
    return HttpResponse.json(
      { message: 'Endpoint not implemented in mock server' },
      { status: 501 }
    )
  })
]

// Export mock data for use in tests
export { mockUsers, mockGames, mockTeams, mockQuestions, mockGameStates }
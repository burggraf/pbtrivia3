import { pb } from '@/services/pocketbase/client'
import type { Game, CreateGameData, Round, Question, RoundQuestion } from '@/types'

class GameService {
  /**
   * Create a new trivia game
   */
  async createGame(config: CreateGameData): Promise<Game> {
    try {
      // Validate game data
      this.validateCreateGameData(config);

      // Create the game record
      const gameData = {
        name: config.name,
        host_id: config.host_id,
        code: this.generateGameCode(),
        status: 'setup' as const,
        min_team_size: config.min_team_size || 1,
        max_team_size: config.max_team_size || 6,
        time_limit_enabled: config.time_limit_enabled || false,
        time_limit_seconds: config.time_limit_enabled ? config.time_limit_seconds : 0,
        sound_effects_enabled: config.sound_effects_enabled !== false, // Default to true
      }

      console.log('🎮 Creating game with data:', JSON.stringify(gameData, null, 2));
      const game = await pb.collection('games').create(gameData) as unknown as Game
      console.log('✅ Game created successfully:', game);
      return game
    } catch (error) {
      console.error('❌ Failed to create game:', error);
      if (error && typeof error === 'object' && 'data' in error) {
        console.error('Error details:', JSON.stringify(error.data, null, 2));
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to create game')
    }
  }

  /**
   * Get a game by ID
   */
  async getGame(gameId: string): Promise<Game | null> {
    try {
      const game = await pb.collection('games').getOne(gameId)
      return game as unknown as Game
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return null
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get game')
    }
  }

  /**
   * Get a game by its join code
   */
  async getGameByCode(gameCode: string): Promise<Game | null> {
    try {
      const games = await pb.collection('games').getFirstListItem(`code = "${gameCode}"`)
      return games as unknown as Game
    } catch (error) {
      if (error instanceof Error && error.message.includes('no items')) {
        return null
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to get game by code')
    }
  }

  /**
   * Update game configuration
   */
  async updateGame(gameId: string, updates: Partial<GameCreationConfig>): Promise<Game> {
    try {
      const game = await pb.collection('games').update(gameId, updates)
      return game as unknown as Game
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update game')
    }
  }

  /**
   * Start a game
   */
  async startGame(gameId: string): Promise<Game> {
    try {
      const game = await this.updateGame(gameId, {
        status: 'playing',
        started_at: new Date().toISOString(),
      })

      // Create the first round
      await this.createRound(gameId, 1)

      return game
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to start game')
    }
  }

  /**
   * Pause a game (not implemented in current schema)
   */
  async pauseGame(gameId: string): Promise<Game> {
    throw new Error('Pause functionality not implemented in current game schema')
  }

  /**
   * Resume a paused game (not implemented in current schema)
   */
  async resumeGame(gameId: string): Promise<Game> {
    throw new Error('Resume functionality not implemented in current game schema')
  }

  /**
   * End a game
   */
  async endGame(gameId: string): Promise<Game> {
    try {
      const game = await this.updateGame(gameId, {
        status: 'finished',
        finished_at: new Date().toISOString(),
      })

      return game
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to end game')
    }
  }

  /**
   * Get games for a host
   */
  async getHostGames(hostId: string, limit = 20): Promise<Game[]> {
    try {
      const games = await pb.collection('games').getList(1, limit, {
        filter: `host_id = "${hostId}"`,
        sort: '-created_at',
      })

      return games.items as unknown as Game[]
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get host games')
    }
  }

  /**
   * Get rounds for a game
   */
  async getGameRounds(gameId: string): Promise<Round[]> {
    try {
      const rounds = await pb.collection('rounds').getFullList({
        filter: `game_id = "${gameId}"`,
        sort: 'round_number asc',
      })

      return rounds as unknown as Round[]
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get game rounds')
    }
  }

  /**
   * Get questions for a round
   */
  async getRoundQuestions(roundId: string): Promise<RoundQuestion[]> {
    try {
      const questions = await pb.collection('round_questions').getFullList({
        filter: `round_id = "${roundId}"`,
        sort: 'question_number asc',
      })

      return questions as unknown as RoundQuestion[]
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get round questions')
    }
  }

  /**
   * Create a new round for a game
   */
  private async createRound(gameId: string, roundNumber: number): Promise<Round> {
    try {
      const roundData = {
        game_id: gameId,
        round_number: roundNumber,
        status: 'setup',
      }

      const round = await pb.collection('rounds').create(roundData)
      return round as unknown as Round
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create round')
    }
  }

  /**
   * Generate questions for a game based on configuration
   */
  private async generateGameQuestions(gameId: string, config: GameCreationConfig): Promise<void> {
    try {
      // Get questions from selected categories
      const questionsNeeded = config.round_count * config.questions_per_round
      const categoryFilter = config.category_ids.map(id => `category = "${id}"`).join(' || ')

      // Get available questions (with some buffer)
      const availableQuestions = await pb.collection('questions').getFullList({
        filter: `(${categoryFilter}) && difficulty = "${config.difficulty}"`,
        sort: '@random',
      })

      if (availableQuestions.length < questionsNeeded) {
        throw new Error(`Not enough questions available. Need ${questionsNeeded}, found ${availableQuestions.length}`)
      }

      // Select random questions
      const selectedQuestions = this.shuffleArray(availableQuestions).slice(0, questionsNeeded)

      // Create rounds and assign questions
      for (let roundNumber = 1; roundNumber <= config.round_count; roundNumber++) {
        // Create the round
        const round = await this.createRound(gameId, roundNumber)

        // Get questions for this round
        const roundStartIndex = (roundNumber - 1) * config.questions_per_round
        const roundQuestions = selectedQuestions.slice(roundStartIndex, roundStartIndex + config.questions_per_round)

        // Create round questions
        for (let questionIndex = 0; questionIndex < roundQuestions.length; questionIndex++) {
          const question = roundQuestions[questionIndex] as any // Type assertion for PocketBase question
          const roundQuestionData = {
            round_id: round.id,
            question_id: question.id,
            question_number: questionIndex + 1,
            time_limit: config.time_per_question,
            points_possible: config.point_values.correct,
            speed_bonus_possible: config.point_values.speed_bonus,
            created_at: new Date().toISOString(),
          }

          await pb.collection('round_questions').create(roundQuestionData)
        }
      }
    } catch (error) {
      console.error('Failed to generate game questions:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to generate game questions')
    }
  }

  /**
   * Delete a game (host only)
   */
  async deleteGame(gameId: string): Promise<void> {
    try {
      await pb.collection('games').delete(gameId)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete game')
    }
  }

  /**
   * Check if a user is the host of a game
   */
  async isGameHost(gameId: string, userId: string): Promise<boolean> {
    try {
      const game = await this.getGame(gameId)
      return game?.host_id === userId || false
    } catch (error) {
      return false
    }
  }

  /**
   * Subscribe to real-time updates for a game
   */
  subscribeToGame(gameId: string, callback: (action: string, record: Game) => void) {
    return pb.collection('games').subscribe(gameId, (e) => {
      callback(e.action, e.record as unknown as Game)
    })
  }

  /**
   * Unsubscribe from game updates
   */
  unsubscribeFromGame(subscription: () => void) {
    subscription()
  }

  /**
   * Validate game creation data
   */
  private validateCreateGameData(config: CreateGameData): void {
    if (!config.name || config.name.trim().length === 0) {
      throw new Error('Game name is required');
    }

    const minTeamSize = config.min_team_size || 1;
    const maxTeamSize = config.max_team_size || 6;

    if (minTeamSize > maxTeamSize) {
      throw new Error('Minimum team size cannot be greater than maximum');
    }

    if (config.time_limit_enabled && config.time_limit_seconds) {
      if (config.time_limit_seconds < 10 || config.time_limit_seconds > 300) {
        throw new Error('Time limit must be between 10 and 300 seconds');
      }
    }
  }

  /**
   * Generate a unique game code (public for testing)
   */
  generateGameCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''

    // Generate 6-character code
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    return code
  }

  /**
   * Validate game code format
   */
  validateGameCode(code: string): boolean {
    // Must be exactly 6 characters, uppercase letters and numbers only
    const codeRegex = /^[A-Z0-9]{6}$/;
    return codeRegex.test(code);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Get game statistics
   */
  async getGameStats(gameId: string): Promise<{
    totalQuestions: number
    answeredQuestions: number
    correctAnswers: number
    totalTeams: number
    activeTeams: number
  }> {
    try {
      // Get game rounds and questions
      const rounds = await this.getGameRounds(gameId)
      const totalQuestions = rounds.reduce((sum, round) => sum + (round.num_questions || 0), 0)

      // Get teams for the game
      const teams = await pb.collection('teams').getFullList({
        filter: `game_id = "${gameId}"`,
      })

      // Get answers for the game (this is complex since answers are linked to round_questions)
      // For now, return simplified stats
      return {
        totalQuestions,
        answeredQuestions: 0, // TODO: Implement proper answer counting
        correctAnswers: 0, // TODO: Implement proper correct answer counting
        totalTeams: teams.length,
        activeTeams: teams.length, // TODO: Implement disqualified team logic
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to get game stats')
    }
  }

  /**
   * Validate game configuration
   */
  validateGameConfig(config: Partial<GameCreationConfig>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.title || config.title.length < 3) {
      errors.push('Game title must be at least 3 characters long')
    }

    if (!config.category_ids || config.category_ids.length === 0) {
      errors.push('At least one category must be selected')
    }

    if (!config.max_teams || config.max_teams < 2 || config.max_teams > 20) {
      errors.push('Maximum teams must be between 2 and 20')
    }

    if (!config.team_size || config.team_size < 1 || config.team_size > 10) {
      errors.push('Team size must be between 1 and 10')
    }

    if (!config.round_count || config.round_count < 1 || config.round_count > 10) {
      errors.push('Round count must be between 1 and 10')
    }

    if (!config.questions_per_round || config.questions_per_round < 1 || config.questions_per_round > 20) {
      errors.push('Questions per round must be between 1 and 20')
    }

    if (!config.time_per_question || config.time_per_question < 10 || config.time_per_question > 300) {
      errors.push('Time per question must be between 10 and 300 seconds')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Create singleton instance
export const gameService = new GameService()

export default gameService
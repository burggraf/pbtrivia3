/**
 * Game Joining Service
 * Handles finding games, joining games, leaving games, and game status
 */

import { pb } from '@/services/pocketbase/client'
import type { User } from '@/types/user'
import type { TeamMember } from '@/types/teamMember'

export interface GameStatusResult {
  status: string
  currentRound?: number
  startedAt?: string
}

export interface GameJoinabilityResult {
  canJoin: boolean
  reason: string
}

export interface JoinedGame {
  id: string
  name: string
  code: string
  status: string
  current_round?: number
  started_at?: string
}

export class GameJoiningService {
  /**
   * Find a game by its unique code
   */
  async findGameByCode(code: string): Promise<any | null> {
    // Validate game code format
    if (!code || code.trim().length === 0) {
      throw new Error('Game code is required')
    }

    if (!/^[A-Z0-9]{4,10}$/.test(code)) {
      throw new Error('Invalid game code format')
    }

    try {
      const game = await pb.collection('games').getFirstListItem(`code = "${code}"`)
      return game
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        return null
      }
      throw new Error(`Failed to find game: ${error.message}`)
    }
  }

  /**
   * Join a game as a player
   */
  async joinGame(user: User, gameCode: string): Promise<TeamMember> {
    // Find the game
    const game = await this.findGameByCode(gameCode)
    if (!game) {
      throw new Error('Game not found')
    }

    // Check if game can be joined
    const joinability = await this.validateGameJoinability(game)
    if (!joinability.canJoin) {
      throw new Error(joinability.reason)
    }

    // Check if user already joined this game
    try {
      const existingMember = await pb.collection('team_members').getFirstListItem(
        `user_id = "${user.id}" && game_id = "${game.id}"`
      )
      if (existingMember) {
        throw new Error('Already joined this game')
      }
    } catch (error) {
      // No existing member found, which is what we want
      if (!error.message.includes('The requested resource wasn\'t found')) {
        throw error
      }
    }

    try {
      const teamMember = await pb.collection('team_members').create({
        user_id: user.id,
        game_id: game.id,
        name: user.name,
        is_captain: false,
        joined_at: new Date().toISOString(),
      })
      return teamMember as TeamMember
    } catch (error) {
      throw new Error(`Failed to join game: ${error.message}`)
    }
  }

  /**
   * Leave a game
   */
  async leaveGame(userId: string, gameId: string): Promise<void> {
    try {
      const member = await pb.collection('team_members').getFirstListItem(
        `user_id = "${userId}" && game_id = "${gameId}"`
      )

      await pb.collection('team_members').delete(member.id)
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        throw new Error('Not joined to this game')
      }
      throw new Error(`Failed to leave game: ${error.message}`)
    }
  }

  /**
   * Get current status of a game
   */
  async getGameStatus(gameId: string): Promise<GameStatusResult | null> {
    try {
      const game = await pb.collection('games').getFirstListItem(`id = "${gameId}"`)

      return {
        status: game.status,
        currentRound: game.current_round,
        startedAt: game.started_at,
      }
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        return null
      }
      throw new Error(`Failed to get game status: ${error.message}`)
    }
  }

  /**
   * Get all games the user has joined
   */
  async getJoinedGames(userId: string): Promise<JoinedGame[]> {
    try {
      const members = await pb.collection('team_members').getFullList(1, 50, {
        filter: `user_id = "${userId}"`,
        expand: 'game_id',
      })

      const games: JoinedGame[] = members.map((member: any) => {
        const game = member.expand?.game_id
        if (!game) return null

        return {
          id: game.id,
          name: game.name,
          code: game.code,
          status: game.status,
          current_round: game.current_round,
          started_at: game.started_at,
        }
      }).filter(Boolean)

      return games
    } catch (error) {
      throw new Error(`Failed to get joined games: ${error.message}`)
    }
  }

  /**
   * Validate if a game can be joined
   */
  async validateGameJoinability(game: any): Promise<GameJoinabilityResult> {
    // Check game status
    if (game.status !== 'setup') {
      return {
        canJoin: false,
        reason: 'Cannot join a game that has already started',
      }
    }

    // Check if maximum teams reached
    try {
      const teams = await pb.collection('teams').getFullList(1, 50, {
        filter: `game_id = "${game.id}"`,
      })

      const maxTeams = game.max_team_size || 10
      if (teams.length >= maxTeams) {
        return {
          canJoin: false,
          reason: 'Maximum number of teams reached',
        }
      }
    } catch (error) {
      // If we can't check teams, assume it's joinable
      console.warn('Could not verify team count:', error.message)
    }

    return {
      canJoin: true,
      reason: '',
    }
  }

  /**
   * Check if user is member of a specific game
   */
  async isGameMember(userId: string, gameId: string): Promise<boolean> {
    try {
      await pb.collection('team_members').getFirstListItem(
        `user_id = "${userId}" && game_id = "${gameId}"`
      )
      return true
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        return false
      }
      throw error
    }
  }

  /**
   * Get user's team membership in a game
   */
  async getUserTeamMembership(userId: string, gameId: string): Promise<TeamMember | null> {
    try {
      const member = await pb.collection('team_members').getFirstListItem(
        `user_id = "${userId}" && game_id = "${gameId}"`
      )
      return member as TeamMember
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        return null
      }
      throw error
    }
  }

  /**
   * Get games available for joining (status = 'setup')
   */
  async getAvailableGames(): Promise<any[]> {
    try {
      const games = await pb.collection('games').getFullList(1, 50, {
        filter: 'status = "setup"',
        sort: '-created',
      })
      return games
    } catch (error) {
      throw new Error(`Failed to get available games: ${error.message}`)
    }
  }

  /**
   * Subscribe to real-time updates for a game
   */
  subscribeToGame(gameId: string, callback: (data: any) => void): () => void {
    const unsubscribe = pb.collection('games').subscribe(gameId, (e) => {
      callback(e.record)
    })

    return unsubscribe
  }

  /**
   * Subscribe to real-time updates for team members in a game
   */
  subscribeToGameMembers(gameId: string, callback: (data: any) => void): () => void {
    const filter = `game_id = "${gameId}"`
    const unsubscribe = pb.collection('team_members').subscribe('*', (e) => {
      if (e.record.game_id === gameId) {
        callback(e.record)
      }
    }, { filter })

    return unsubscribe
  }
}

// Export singleton instance
export const gameJoiningService = new GameJoiningService()
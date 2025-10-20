import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameJoiningService } from '@/services/player/gameJoiningService'
import { pb } from '@/services/pocketbase/client'

// Mock PocketBase
vi.mock('@/services/pocketbase/client', () => ({
  pb: {
    collection: vi.fn(() => ({
      getFirstListItem: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getFullList: vi.fn(),
    })),
    send: vi.fn(),
  },
}))

describe('GameJoiningService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findGameByCode', () => {
    it('should find game by code successfully', async () => {
      const mockGame = {
        id: 'game123',
        name: 'Test Game',
        code: 'GAME01',
        status: 'setup',
        host_id: 'host123',
        min_team_size: 2,
        max_team_size: 6,
      }

      const mockCollection = pb.collection('games')
      vi.mocked(mockCollection.getFirstListItem).mockResolvedValue(mockGame)

      const result = await gameJoiningService.findGameByCode('GAME01')

      expect(mockCollection.getFirstListItem).toHaveBeenCalledWith('code = "GAME01"')
      expect(result).toEqual(mockGame)
    })

    it('should return null when game not found', async () => {
      const mockCollection = pb.collection('games')
      vi.mocked(mockCollection.getFirstListItem).mockRejectedValue(new Error('The requested resource wasn\'t found.'))

      const result = await gameJoiningService.findGameByCode('INVALID')

      expect(result).toBeNull()
    })

    it('should validate game code format', async () => {
      await expect(gameJoiningService.findGameByCode('')).rejects.toThrow('Game code is required')
      await expect(gameJoiningService.findGameByCode('TOOLONGCODE')).rejects.toThrow('Invalid game code format')
    })
  })

  describe('joinGame', () => {
    it('should allow player to join game successfully', async () => {
      const mockUser = { id: 'user123', name: 'Test Player' }
      const mockGame = {
        id: 'game123',
        code: 'GAME01',
        status: 'setup',
        min_team_size: 2,
        max_team_size: 6,
      }
      const mockPlayerRecord = {
        id: 'player123',
        user_id: mockUser.id,
        game_id: mockGame.id,
        status: 'joined',
        joined_at: new Date().toISOString(),
      }

      const mockGamesCollection = pb.collection('games')
      vi.mocked(mockGamesCollection.getFirstListItem).mockResolvedValue(mockGame)

      const mockTeamMembersCollection = pb.collection('team_members')
      vi.mocked(mockTeamMembersCollection.create).mockResolvedValue(mockPlayerRecord)

      const result = await gameJoiningService.joinGame(mockUser, 'GAME01')

      expect(mockGamesCollection.getFirstListItem).toHaveBeenCalledWith('code = "GAME01"')
      expect(mockTeamMembersCollection.create).toHaveBeenCalledWith({
        user_id: mockUser.id,
        game_id: mockGame.id,
        name: mockUser.name,
        is_captain: false,
        joined_at: expect.any(String),
      })
      expect(result).toEqual(mockPlayerRecord)
    })

    it('should prevent joining game that has already started', async () => {
      const mockGame = {
        id: 'game123',
        code: 'GAME01',
        status: 'active',
        min_team_size: 2,
        max_team_size: 6,
      }
      const mockUser = { id: 'user123', name: 'Test Player' }

      const mockGamesCollection = pb.collection('games')
      vi.mocked(mockGamesCollection.getFirstListItem).mockResolvedValue(mockGame)

      await expect(gameJoiningService.joinGame(mockUser, 'GAME01')).rejects.toThrow('Cannot join a game that has already started')
    })

    it('should prevent joining same game twice', async () => {
      const mockUser = { id: 'user123', name: 'Test Player' }
      const mockGame = {
        id: 'game123',
        code: 'GAME01',
        status: 'setup',
        min_team_size: 2,
        max_team_size: 6,
      }
      const mockExistingTeamMember = {
        id: 'existing123',
        user_id: mockUser.id,
        game_id: mockGame.id,
      }

      const mockGamesCollection = pb.collection('games')
      vi.mocked(mockGamesCollection.getFirstListItem).mockResolvedValue(mockGame)

      const mockTeamMembersCollection = pb.collection('team_members')
      vi.mocked(mockTeamMembersCollection.getFirstListItem).mockResolvedValue(mockExistingTeamMember)

      await expect(gameJoiningService.joinGame(mockUser, 'GAME01')).rejects.toThrow('Already joined this game')
    })
  })

  describe('leaveGame', () => {
    it('should allow player to leave game successfully', async () => {
      const mockTeamMember = {
        id: 'member123',
        user_id: 'user123',
        game_id: 'game123',
        team_id: 'team123',
      }

      const mockTeamMembersCollection = pb.collection('team_members')
      vi.mocked(mockTeamMembersCollection.getFirstListItem).mockResolvedValue(mockTeamMember)
      vi.mocked(mockTeamMembersCollection.delete).mockResolvedValue(undefined)

      await gameJoiningService.leaveGame('user123', 'game123')

      expect(mockTeamMembersCollection.getFirstListItem).toHaveBeenCalledWith(
        'user_id = "user123" && game_id = "game123"'
      )
      expect(mockTeamMembersCollection.delete).toHaveBeenCalledWith('member123')
    })

    it('should handle leaving game when not joined', async () => {
      const mockTeamMembersCollection = pb.collection('team_members')
      vi.mocked(mockTeamMembersCollection.getFirstListItem).mockRejectedValue(
        new Error('The requested resource wasn\'t found.')
      )

      await expect(gameJoiningService.leaveGame('user123', 'game123')).rejects.toThrow('Not joined to this game')
    })
  })

  describe('getGameStatus', () => {
    it('should return current game status', async () => {
      const mockGame = {
        id: 'game123',
        code: 'GAME01',
        status: 'active',
        current_round: 2,
        started_at: '2025-01-19T20:00:00Z',
      }

      const mockCollection = pb.collection('games')
      vi.mocked(mockCollection.getFirstListItem).mockResolvedValue(mockGame)

      const result = await gameJoiningService.getGameStatus('game123')

      expect(mockCollection.getFirstListItem).toHaveBeenCalledWith('id = "game123"')
      expect(result).toEqual({
        status: mockGame.status,
        currentRound: mockGame.current_round,
        startedAt: mockGame.started_at,
      })
    })

    it('should return null for non-existent game', async () => {
      const mockCollection = pb.collection('games')
      vi.mocked(mockCollection.getFirstListItem).mockRejectedValue(
        new Error('The requested resource wasn\'t found.')
      )

      const result = await gameJoiningService.getGameStatus('invalid123')

      expect(result).toBeNull()
    })
  })

  describe('getJoinedGames', () => {
    it('should return list of games user has joined', async () => {
      const mockTeamMembers = [
        {
          id: 'member1',
          game_id: 'game1',
          name: 'Game 1',
          code: 'GAME01',
          status: 'setup',
        },
        {
          id: 'member2',
          game_id: 'game2',
          name: 'Game 2',
          code: 'GAME02',
          status: 'active',
        },
      ]

      const mockTeamMembersCollection = pb.collection('team_members')
      vi.mocked(mockTeamMembersCollection.getFullList).mockResolvedValue(mockTeamMembers)

      const result = await gameJoiningService.getJoinedGames('user123')

      expect(mockTeamMembersCollection.getFullList).toHaveBeenCalledWith(
        1,
        50,
        {
          filter: 'user_id = "user123"',
          expand: 'game_id',
        }
      )
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Game 1')
      expect(result[1].name).toBe('Game 2')
    })

    it('should return empty list when user hasn\'t joined any games', async () => {
      const mockTeamMembersCollection = pb.collection('team_members')
      vi.mocked(mockTeamMembersCollection.getFullList).mockResolvedValue([])

      const result = await gameJoiningService.getJoinedGames('user123')

      expect(result).toEqual([])
    })
  })

  describe('validateGameJoinability', () => {
    it('should validate game can be joined', async () => {
      const mockGame = {
        id: 'game123',
        status: 'setup',
        max_team_size: 6,
      }

      // Mock team count query
      const mockTeamsCollection = pb.collection('teams')
      vi.mocked(mockTeamsCollection.getFullList).mockResolvedValue([
        { id: 'team1' },
        { id: 'team2' },
        { id: 'team3' },
      ])

      const result = await gameJoiningService.validateGameJoinability(mockGame)

      expect(result.canJoin).toBe(true)
      expect(result.reason).toBe('')
    })

    it('should reject game that has started', async () => {
      const mockGame = {
        id: 'game123',
        status: 'active',
        max_team_size: 6,
      }

      const result = await gameJoiningService.validateGameJoinability(mockGame)

      expect(result.canJoin).toBe(false)
      expect(result.reason).toBe('Game has already started')
    })

    it('should reject game with maximum teams', async () => {
      const mockGame = {
        id: 'game123',
        status: 'setup',
        max_team_size: 3,
      }

      // Mock max teams already reached
      const mockTeamsCollection = pb.collection('teams')
      vi.mocked(mockTeamsCollection.getFullList).mockResolvedValue([
        { id: 'team1' },
        { id: 'team2' },
        { id: 'team3' },
      ])

      const result = await gameJoiningService.validateGameJoinability(mockGame)

      expect(result.canJoin).toBe(false)
      expect(result.reason).toBe('Maximum number of teams reached')
    })
  })
})
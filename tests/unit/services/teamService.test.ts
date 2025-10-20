import { describe, it, expect, vi, beforeEach } from 'vitest'
import { teamService } from '@/services/player/teamService'
import { pb } from '@/services/pocketbase/client'

// Create mock collections
const mockTeamsCollection = {
  getFirstListItem: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getFullList: vi.fn(),
}

const mockTeamMembersCollection = {
  getFirstListItem: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getFullList: vi.fn(),
}

// Mock PocketBase
vi.mock('@/services/pocketbase/client', () => ({
  pb: {
    collection: vi.fn((collectionName: string) => {
      if (collectionName === 'teams') {
        return mockTeamsCollection
      } else if (collectionName === 'team_members') {
        return mockTeamMembersCollection
      }
      return {
        getFirstListItem: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getFullList: vi.fn(),
      }
    }),
  },
}))

describe('TeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTeam', () => {
    it('should create a new team successfully', async () => {
      const mockTeam = {
        id: 'team123',
        game_id: 'game123',
        name: 'Test Team',
        team_number: 1,
        score: 0,
        status: 'forming',
        created_at: new Date().toISOString(),
      }

      const mockCollection = pb.collection('teams')
      mockCollection.create.mockResolvedValue(mockTeam)

      const teamData = {
        game_id: 'game123',
        name: 'Test Team',
        team_number: 1,
      }

      const result = await teamService.createTeam(teamData)

      expect(mockCollection.create).toHaveBeenCalledWith({
        ...teamData,
        score: 0,
        status: 'forming',
        created_at: expect.any(String),
      })
      expect(result).toEqual(mockTeam)
    })

    it('should validate team name is not empty', async () => {
      const teamData = {
        game_id: 'game123',
        name: '',
        team_number: 1,
      }

      await expect(teamService.createTeam(teamData)).rejects.toThrow('Team name is required')
    })

    it('should validate team name length', async () => {
      const teamData = {
        game_id: 'game123',
        name: 'A'.repeat(51), // 51 characters, exceeds max 50
        team_number: 1,
      }

      await expect(teamService.createTeam(teamData)).rejects.toThrow('Team name must be 50 characters or less')
    })

    it('should ensure unique team number within game', async () => {
      const mockExistingTeam = {
        id: 'existing123',
        game_id: 'game123',
        team_number: 1,
      }

      const mockCollection = pb.collection('teams')
      mockTeamMembersCollection.getFirstListItem.mockResolvedValue(mockExistingTeam)

      const teamData = {
        game_id: 'game123',
        name: 'Test Team',
        team_number: 1, // Same number as existing team
      }

      await expect(teamService.createTeam(teamData)).rejects.toThrow('Team number already exists in this game')
    })
  })

  describe('joinTeam', () => {
    it('should allow player to join team successfully', async () => {
      const mockTeam = {
        id: 'team123',
        game_id: 'game123',
        name: 'Test Team',
        status: 'forming',
      }
      const mockUser = { id: 'user123', name: 'Test Player' }
      const mockTeamMember = {
        id: 'member123',
        team_id: mockTeam.id,
        user_id: mockUser.id,
        name: mockUser.name,
        is_captain: false,
        joined_at: new Date().toISOString(),
      }

      mockTeamsCollection.getFirstListItem.mockResolvedValue(mockTeam)

      // Mock the check for existing membership - return "not found" error
      mockTeamMembersCollection.getFirstListItem.mockRejectedValueOnce(
        new Error('The requested resource wasn\'t found')
      )
      mockTeamMembersCollection.create.mockResolvedValue(mockTeamMember)

      const result = await teamService.joinTeam(mockUser, mockTeam.id)

      expect(mockTeamsCollection.getFirstListItem).toHaveBeenCalledWith(`id = "${mockTeam.id}"`)
      expect(mockTeamMembersCollection.getFirstListItem).toHaveBeenCalledWith(
        `team_id = "${mockTeam.id}" && user_id = "${mockUser.id}"`
      )
      expect(mockTeamMembersCollection.create).toHaveBeenCalledWith({
        team_id: mockTeam.id,
        user_id: mockUser.id,
        name: mockUser.name,
        is_captain: false,
        joined_at: expect.any(String),
      })
      expect(result).toEqual(mockTeamMember)
    })

    it('should prevent joining team that is already playing', async () => {
      const mockTeam = {
        id: 'team123',
        game_id: 'game123',
        name: 'Test Team',
        status: 'playing',
      }
      const mockUser = { id: 'user123', name: 'Test Player' }

      mockTeamsCollection.getFirstListItem.mockResolvedValue(mockTeam)

      await expect(teamService.joinTeam(mockUser, mockTeam.id)).rejects.toThrow('Cannot join a team that is already playing')
    })

    it('should prevent joining same team twice', async () => {
      const mockTeam = {
        id: 'team123',
        game_id: 'game123',
        name: 'Test Team',
        status: 'forming',
      }
      const mockUser = { id: 'user123', name: 'Test Player' }
      const mockExistingMember = {
        id: 'existing123',
        team_id: mockTeam.id,
        user_id: mockUser.id,
      }

      mockTeamsCollection.getFirstListItem.mockResolvedValue(mockTeam)

            mockTeamMembersCollection.getFirstListItem.mockResolvedValue(mockExistingMember)

      await expect(teamService.joinTeam(mockUser, mockTeam.id)).rejects.toThrow('Already a member of this team')
    })
  })

  describe('leaveTeam', () => {
    it('should allow player to leave team successfully', async () => {
      const mockTeamMember = {
        id: 'member123',
        team_id: 'team123',
        user_id: 'user123',
        is_captain: false,
      }

            mockTeamMembersCollection.getFirstListItem.mockResolvedValue(mockTeamMember)
      mockTeamMembersCollection.delete.mockResolvedValue(undefined)

      await teamService.leaveTeam('user123', 'team123')

      expect(mockTeamMembersCollection.getFirstListItem).toHaveBeenCalledWith(
        'team_id = "team123" && user_id = "user123"'
      )
      expect(mockTeamMembersCollection.delete).toHaveBeenCalledWith('member123')
    })

    it('should prevent captain from leaving if team has other members', async () => {
      const mockCaptainMember = {
        id: 'captain123',
        team_id: 'team123',
        user_id: 'user123',
        is_captain: true,
      }
      const mockOtherMember = {
        id: 'other123',
        team_id: 'team123',
        user_id: 'other456',
        is_captain: false,
      }

            mockTeamMembersCollection.getFirstListItem
        .mockResolvedValueOnce(mockCaptainMember) // First call gets captain
        .mockResolvedValueOnce(mockOtherMember)  // Second call finds other member
      mockTeamMembersCollection.getFullList.mockResolvedValue([mockOtherMember]) // Other members found

      await expect(teamService.leaveTeam('user123', 'team123')).rejects.toThrow(
        'Team captain cannot leave while other members are present'
      )
    })

    it('should delete team if captain leaves and no other members', async () => {
      const mockCaptainMember = {
        id: 'captain123',
        team_id: 'team123',
        user_id: 'user123',
        is_captain: true,
      }
      const mockTeam = {
        id: 'team123',
        name: 'Test Team',
      }

            
      mockTeamMembersCollection.getFirstListItem
        .mockResolvedValueOnce(mockCaptainMember) // Get captain member

      mockTeamMembersCollection.getFullList.mockResolvedValue([]) // No other members
      mockTeamMembersCollection.delete.mockResolvedValue(undefined)
      mockTeamsCollection.delete.mockResolvedValue(undefined)

      await teamService.leaveTeam('user123', 'team123')

      expect(mockTeamMembersCollection.delete).toHaveBeenCalledWith('captain123')
      expect(mockTeamsCollection.delete).toHaveBeenCalledWith('team123')
    })
  })

  describe('getTeamsForGame', () => {
    it('should return all teams for a game', async () => {
      const mockTeams = [
        {
          id: 'team1',
          game_id: 'game123',
          name: 'Team 1',
          team_number: 1,
          score: 10,
          status: 'ready',
        },
        {
          id: 'team2',
          game_id: 'game123',
          name: 'Team 2',
          team_number: 2,
          score: 5,
          status: 'forming',
        },
      ]

      const mockCollection = pb.collection('teams')
      mockCollection.getFullList.mockResolvedValue(mockTeams)

      const result = await teamService.getTeamsForGame('game123')

      expect(mockCollection.getFullList).toHaveBeenCalledWith(1, 50, {
        filter: 'game_id = "game123"',
        sort: 'team_number',
      })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Team 1')
      expect(result[1].name).toBe('Team 2')
    })

    it('should return empty array for game with no teams', async () => {
      const mockCollection = pb.collection('teams')
      mockCollection.getFullList.mockResolvedValue([])

      const result = await teamService.getTeamsForGame('game123')

      expect(result).toEqual([])
    })
  })

  describe('getTeamMembers', () => {
    it('should return all members of a team', async () => {
      const mockMembers = [
        {
          id: 'member1',
          team_id: 'team123',
          user_id: 'user1',
          name: 'Player 1',
          is_captain: true,
          joined_at: '2025-01-19T20:00:00Z',
        },
        {
          id: 'member2',
          team_id: 'team123',
          user_id: 'user2',
          name: 'Player 2',
          is_captain: false,
          joined_at: '2025-01-19T20:01:00Z',
        },
      ]

            mockCollection.getFullList.mockResolvedValue(mockMembers)

      const result = await teamService.getTeamMembers('team123')

      expect(mockCollection.getFullList).toHaveBeenCalledWith(1, 50, {
        filter: 'team_id = "team123"',
        sort: 'joined_at',
      })
      expect(result).toHaveLength(2)
      expect(result[0].is_captain).toBe(true)
      expect(result[1].is_captain).toBe(false)
    })

    it('should return empty array for team with no members', async () => {
            mockCollection.getFullList.mockResolvedValue([])

      const result = await teamService.getTeamMembers('team123')

      expect(result).toEqual([])
    })
  })

  describe('updateTeamStatus', () => {
    it('should update team status successfully', async () => {
      const mockTeam = {
        id: 'team123',
        name: 'Test Team',
        status: 'ready',
      }

      const mockCollection = pb.collection('teams')
      mockTeamMembersCollection.update.mockResolvedValue(mockTeam)

      const result = await teamService.updateTeamStatus('team123', 'ready')

      expect(mockTeamMembersCollection.update).toHaveBeenCalledWith('team123', {
        status: 'ready',
      })
      expect(result).toEqual(mockTeam)
    })

    it('should validate team status', async () => {
      await expect(teamService.updateTeamStatus('team123', 'invalid')).rejects.toThrow(
        'Invalid team status. Must be one of: forming, ready, playing'
      )
    })
  })

  describe('promoteToCaptain', () => {
    it('should promote team member to captain successfully', async () => {
      const mockCurrentCaptain = {
        id: 'captain123',
        team_id: 'team123',
        is_captain: true,
      }
      const mockNewCaptain = {
        id: 'member123',
        team_id: 'team123',
        user_id: 'user123',
        is_captain: false,
        name: 'New Captain',
      }
      const mockUpdatedMember = {
        ...mockNewCaptain,
        is_captain: true,
      }

            mockTeamMembersCollection.getFirstListItem
        .mockResolvedValueOnce(mockCurrentCaptain)
        .mockResolvedValueOnce(mockNewCaptain)

      mockTeamMembersCollection.update
        .mockResolvedValueOnce({...mockCurrentCaptain, is_captain: false}) // Demote current captain
        .mockResolvedValueOnce(mockUpdatedMember) // Promote new captain

      const result = await teamService.promoteToCaptain('user123', 'team123')

      expect(mockTeamMembersCollection.update).toHaveBeenCalledWith('captain123', { is_captain: false })
      expect(mockTeamMembersCollection.update).toHaveBeenCalledWith('member123', { is_captain: true })
      expect(result).toEqual(mockUpdatedMember)
    })

    it('should handle promoting when no current captain exists', async () => {
      const mockMember = {
        id: 'member123',
        team_id: 'team123',
        user_id: 'user123',
        is_captain: false,
        name: 'New Captain',
      }
      const mockUpdatedMember = {
        ...mockMember,
        is_captain: true,
      }

            mockTeamMembersCollection.getFirstListItem
        .mockRejectedValueOnce(new Error('No current captain found'))
        .mockResolvedValueOnce(mockMember)

      mockTeamMembersCollection.update.mockResolvedValue(mockUpdatedMember)

      const result = await teamService.promoteToCaptain('user123', 'team123')

      expect(mockTeamMembersCollection.update).toHaveBeenCalledWith('member123', { is_captain: true })
      expect(result).toEqual(mockUpdatedMember)
    })
  })
})
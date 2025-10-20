/**
 * Team Service
 * Handles team creation, joining, leaving, and management
 */

import { pb } from '@/services/pocketbase/client'
import type { User } from '@/types/user'
import type { Team, TeamStatus } from '@/types/team'
import type { TeamMember } from '@/types/teamMember'

export class TeamService {
  /**
   * Create a new team
   */
  async createTeam(teamData: {
    game_id: string
    name: string
    team_number: number
  }): Promise<Team> {
    // Validate team name
    if (!teamData.name || teamData.name.trim().length === 0) {
      throw new Error('Team name is required')
    }

    if (teamData.name.length > 50) {
      throw new Error('Team name must be 50 characters or less')
    }

    // Validate team number
    if (teamData.team_number < 1 || teamData.team_number > 10) {
      throw new Error('Team number must be between 1 and 10')
    }

    // Check if team number already exists in this game
    try {
      const existingTeam = await pb.collection('teams').getFirstListItem(
        `game_id = "${teamData.game_id}" && team_number = ${teamData.team_number}`
      )
      if (existingTeam) {
        throw new Error('Team number already exists in this game')
      }
    } catch (error) {
      if (!error.message.includes('The requested resource wasn\'t found')) {
        throw error
      }
      // No existing team found, which is what we want
    }

    try {
      const team = await pb.collection('teams').create({
        game_id: teamData.game_id,
        name: teamData.name.trim(),
        team_number: teamData.team_number,
        score: 0,
        status: 'forming' as TeamStatus,
        created_at: new Date().toISOString(),
      })
      return team as Team
    } catch (error) {
      throw new Error(`Failed to create team: ${error.message}`)
    }
  }

  /**
   * Join a team
   */
  async joinTeam(user: User, teamId: string): Promise<TeamMember> {
    // Get team details
    try {
      const team = await pb.collection('teams').getFirstListItem(`id = "${teamId}"`)

      // Check if team can be joined
      if (team.status === 'playing') {
        throw new Error('Cannot join a team that is already playing')
      }

      // Check if user already a member of this team
      try {
        const existingMember = await pb.collection('team_members').getFirstListItem(
          `team_id = "${teamId}" && user_id = "${user.id}"`
        )
        if (existingMember) {
          throw new Error('Already a member of this team')
        }
      } catch (error) {
        if (!error.message.includes('The requested resource wasn\'t found')) {
          throw error
        }
        // No existing member found, which is what we want
      }

      // Create team member
      const teamMember = await pb.collection('team_members').create({
        team_id: teamId,
        user_id: user.id,
        name: user.name,
        is_captain: false,
        joined_at: new Date().toISOString(),
      })

      return teamMember as TeamMember
    } catch (error) {
      throw new Error(`Failed to join team: ${error.message}`)
    }
  }

  /**
   * Leave a team
   */
  async leaveTeam(userId: string, teamId: string): Promise<void> {
    try {
      // Get the team member record
      const member = await pb.collection('team_members').getFirstListItem(
        `team_id = "${teamId}" && user_id = "${userId}"`
      )

      // Check if user is captain and team has other members
      if (member.is_captain) {
        try {
          const otherMembers = await pb.collection('team_members').getFullList(1, 50, {
            filter: `team_id = "${teamId}" && user_id != "${userId}"`
          })

          if (otherMembers.length > 0) {
            throw new Error('Team captain cannot leave while other members are present')
          }

          // If captain is leaving and no other members, delete the team
          await pb.collection('teams').delete(teamId)
        } catch (error) {
          if (!error.message.includes('The requested resource weren\'t found')) {
            throw error
          }
        }
      }

      // Delete the team member record
      await pb.collection('team_members').delete(member.id)

    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        throw new Error('Not a member of this team')
      }
      throw new Error(`Failed to leave team: ${error.message}`)
    }
  }

  /**
   * Get all teams for a game
   */
  async getTeamsForGame(gameId: string): Promise<Team[]> {
    try {
      const teams = await pb.collection('teams').getFullList(1, 50, {
        filter: `game_id = "${gameId}"`,
        sort: 'team_number',
      })
      return teams as Team[]
    } catch (error) {
      throw new Error(`Failed to get teams for game: ${error.message}`)
    }
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    try {
      const members = await pb.collection('team_members').getFullList(1, 50, {
        filter: `team_id = "${teamId}"`,
        sort: 'joined_at',
      })
      return members as TeamMember[]
    } catch (error) {
      throw new Error(`Failed to get team members: ${error.message}`)
    }
  }

  /**
   * Update team status
   */
  async updateTeamStatus(teamId: string, status: TeamStatus): Promise<Team> {
    // Validate team status
    const validStatuses: TeamStatus[] = ['forming', 'ready', 'playing']
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid team status. Must be one of: forming, ready, playing')
    }

    try {
      const team = await pb.collection('teams').update(teamId, {
        status: status,
      })
      return team as Team
    } catch (error) {
      throw new Error(`Failed to update team status: ${error.message}`)
    }
  }

  /**
   * Promote a team member to captain
   */
  async promoteToCaptain(userId: string, teamId: string): Promise<TeamMember> {
    try {
      // Get current captain
      let currentCaptain = null
      try {
        currentCaptain = await pb.collection('team_members').getFirstListItem(
          `team_id = "${teamId}" && is_captain = true`
        )
      } catch (error) {
        // No current captain found, which is fine
        if (!error.message.includes('The requested resource wasn\'t found')) {
          throw error
        }
      }

      // Get the member to promote
      const memberToPromote = await pb.collection('team_members').getFirstListItem(
        `team_id = "${teamId}" && user_id = "${userId}"`
      )

      // If there's a current captain, demote them
      if (currentCaptain) {
        await pb.collection('team_members').update(currentCaptain.id, {
          is_captain: false,
        })
      }

      // Promote the new captain
      const updatedMember = await pb.collection('team_members').update(memberToPromote.id, {
        is_captain: true,
      })

      return updatedMember as TeamMember
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        throw new Error('User is not a member of this team')
      }
      throw new Error(`Failed to promote to captain: ${error.message}`)
    }
  }

  /**
   * Get team captain
   */
  async getTeamCaptain(teamId: string): Promise<TeamMember | null> {
    try {
      const captain = await pb.collection('team_members').getFirstListItem(
        `team_id = "${teamId}" && is_captain = true`
      )
      return captain as TeamMember
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        return null
      }
      throw error
    }
  }

  /**
   * Check if user is captain of a team
   */
  async isTeamCaptain(userId: string, teamId: string): Promise<boolean> {
    try {
      const member = await pb.collection('team_members').getFirstListItem(
        `team_id = "${teamId}" && user_id = "${userId}" && is_captain = true`
      )
      return !!member
    } catch (error) {
      if (error.message.includes('The requested resource wasn\'t found')) {
        return false
      }
      throw error
    }
  }

  /**
   * Update team name
   */
  async updateTeamName(teamId: string, name: string): Promise<Team> {
    if (!name || name.trim().length === 0) {
      throw new Error('Team name is required')
    }

    if (name.length > 50) {
      throw new Error('Team name must be 50 characters or less')
    }

    try {
      const team = await pb.collection('teams').update(teamId, {
        name: name.trim(),
      })
      return team as Team
    } catch (error) {
      throw new Error(`Failed to update team name: ${error.message}`)
    }
  }

  /**
   * Update team score
   */
  async updateTeamScore(teamId: string, score: number): Promise<Team> {
    if (score < 0) {
      throw new Error('Team score cannot be negative')
    }

    try {
      const team = await pb.collection('teams').update(teamId, {
        score: score,
      })
      return team as Team
    } catch (error) {
      throw new Error(`Failed to update team score: ${error.message}`)
    }
  }

  /**
   * Get team with member count
   */
  async getTeamWithMemberCount(teamId: string): Promise<Team & { member_count: number }> {
    try {
      const team = await pb.collection('teams').getFirstListItem(`id = "${teamId}"`)
      const members = await this.getTeamMembers(teamId)

      return {
        ...team,
        member_count: members.length,
      } as Team & { member_count: number }
    } catch (error) {
      throw new Error(`Failed to get team with member count: ${error.message}`)
    }
  }

  /**
   * Delete a team (host only)
   */
  async deleteTeam(teamId: string): Promise<void> {
    try {
      // Delete all team members first
      const members = await this.getTeamMembers(teamId)
      for (const member of members) {
        await pb.collection('team_members').delete(member.id)
      }

      // Delete the team
      await pb.collection('teams').delete(teamId)
    } catch (error) {
      throw new Error(`Failed to delete team: ${error.message}`)
    }
  }

  /**
   * Subscribe to real-time updates for a team
   */
  subscribeToTeam(teamId: string, callback: (data: any) => void): () => void {
    const unsubscribe = pb.collection('teams').subscribe(teamId, (e) => {
      callback(e.record)
    })

    return unsubscribe
  }

  /**
   * Subscribe to real-time updates for team members
   */
  subscribeToTeamMembers(teamId: string, callback: (data: any) => void): () => void {
    const filter = `team_id = "${teamId}"`
    const unsubscribe = pb.collection('team_members').subscribe('*', (e) => {
      if (e.record.team_id === teamId) {
        callback(e.record)
      }
    }, { filter })

    return unsubscribe
  }
}

// Export singleton instance
export const teamService = new TeamService()
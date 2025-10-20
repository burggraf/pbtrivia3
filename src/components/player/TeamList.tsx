/**
 * Team List Component
 * Displays available teams in a game and allows players to join them
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Crown, Plus } from 'lucide-react'
import { teamService } from '@/services/player/teamService'
import { pb } from '@/services/pocketbase/client'
import type { User } from '@/types/user'
import type { Team } from '@/types/team'
import type { TeamMember } from '@/types/teamMember'

interface TeamListProps {
  gameId: string
  user: User
  onTeamJoined: () => void
  onCreateTeam: () => void
}

interface TeamWithMembers extends Team {
  member_count: number
  members: TeamMember[]
}

export function TeamList({ gameId, user, onTeamJoined, onCreateTeam }: TeamListProps) {
  const [teams, setTeams] = useState<TeamWithMembers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()

    // Subscribe to real-time updates
    const unsubscribeTeams = teamService.subscribeToTeamMembers(gameId, () => {
      loadTeams()
    })

    return () => {
      unsubscribeTeams()
    }
  }, [gameId])

  const loadTeams = async () => {
    try {
      setIsLoading(true)
      const teamsData = await teamService.getTeamsForGame(gameId)

      const teamsWithMembers = await Promise.all(
        teamsData.map(async (team) => {
          const members = await teamService.getTeamMembers(team.id)
          return {
            ...team,
            member_count: members.length,
            members
          }
        })
      )

      setTeams(teamsWithMembers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    setJoiningTeamId(teamId)
    setError(null)

    try {
      await teamService.joinTeam(user, teamId)
      onTeamJoined()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join team')
    } finally {
      setJoiningTeamId(null)
    }
  }

  const canJoinTeam = (team: TeamWithMembers) => {
    // Check if user is already in this team
    const isAlreadyMember = team.members.some(member => member.user_id === user.id)
    if (isAlreadyMember) return false

    // Check if team is in forming status
    if (team.status !== 'forming') return false

    return true
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'forming':
        return 'bg-yellow-100 text-yellow-800'
      case 'ready':
        return 'bg-blue-100 text-blue-800'
      case 'playing':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isUserInAnyTeam = teams.some(team =>
    team.members.some(member => member.user_id === user.id)
  )

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading teams...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            Join a Team
          </CardTitle>
          <CardDescription>
            Select an existing team or create a new one to participate in the game.
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isUserInAnyTeam && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Don't see a team you want to join?
              </p>
              <Button onClick={onCreateTeam} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create New Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const isUserMember = team.members.some(member => member.user_id === user.id)
          const captain = team.members.find(member => member.is_captain)
          const canJoin = canJoinTeam(team)

          return (
            <Card
              key={team.id}
              className={`transition-all ${isUserMember ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {team.name}
                    {captain?.user_id === user.id && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </CardTitle>
                  <Badge className={getStatusColor(team.status)}>
                    {team.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Team #{team.team_number}</span>
                  <span>{team.member_count} members</span>
                </div>

                {team.members.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {team.members.map((member) => (
                        <Badge
                          key={member.id}
                          variant={member.is_captain ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {member.name}
                          {member.is_captain && ' 👑'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {isUserMember ? (
                  <div className="text-center">
                    <Badge variant="default" className="w-full justify-center">
                      You're in this team
                    </Badge>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleJoinTeam(team.id)}
                    disabled={!canJoin || joiningTeamId === team.id}
                    className="w-full"
                    variant={canJoin ? "default" : "secondary"}
                  >
                    {joiningTeamId === team.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : canJoin ? (
                      'Join Team'
                    ) : (
                      team.status === 'playing' ? 'Game in Progress' : 'Cannot Join'
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="text-center p-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Teams Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a team for this game!
            </p>
            <Button onClick={onCreateTeam}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Team
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
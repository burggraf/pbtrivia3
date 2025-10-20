/**
 * Player Join Page
 * Main page for players to join games and manage teams
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { GameJoinForm } from '@/components/player/GameJoinForm'
import { TeamList } from '@/components/player/TeamList'
import { TeamCreationForm } from '@/components/player/TeamCreationForm'
import { gameJoiningService } from '@/services/player/gameJoiningService'
import { teamService } from '@/services/player/teamService'
import { Loader2, Users, Gamepad2, ArrowLeft, Crown } from 'lucide-react'
import type { User, Team, TeamMember, Game } from '@/types/user'

type ViewState = 'join-game' | 'team-list' | 'create-team'

export function PlayerJoinPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [userTeam, setUserTeam] = useState<Team | null>(null)
  const [userTeamMembership, setUserTeamMembership] = useState<TeamMember | null>(null)
  const [viewState, setViewState] = useState<ViewState>('join-game')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      checkExistingGameMembership()
    }
  }, [user])

  const checkExistingGameMembership = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const joinedGames = await gameJoiningService.getJoinedGames(user.id)

      if (joinedGames.length > 0) {
        const activeGame = joinedGames.find(game =>
          game.status === 'setup' || game.status === 'live' || game.status === 'in_progress'
        )

        if (activeGame) {
          setCurrentGame(activeGame)
          await checkTeamMembership(activeGame.id)
          setViewState('team-list')
        }
      }
    } catch (err) {
      console.error('Failed to check game membership:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const checkTeamMembership = async (gameId: string) => {
    if (!user) return

    try {
      const membership = await gameJoiningService.getUserTeamMembership(user.id, gameId)
      if (membership) {
        const teamDetails = await teamService.getTeamWithMemberCount(membership.team_id)
        setUserTeam(teamDetails)
        setUserTeamMembership(membership)
      }
    } catch (err) {
      console.error('Failed to check team membership:', err)
    }
  }

  const handleGameJoined = async (game: Game) => {
    setCurrentGame(game)
    setViewState('team-list')
    toast({
      title: 'Game Joined!',
      description: 'You can now join or create a team.',
    })
  }

  const handleTeamJoined = async () => {
    if (currentGame && user) {
      await checkTeamMembership(currentGame.id)
      toast({
        title: 'Team Joined!',
        description: 'You are now part of a team.',
      })
    }
  }

  const handleTeamCreated = async () => {
    if (currentGame && user) {
      await checkTeamMembership(currentGame.id)
      toast({
        title: 'Team Created!',
        description: 'You are now the team captain.',
      })
    }
  }

  const handleLeaveGame = async () => {
    if (!currentGame || !user) return

    try {
      await gameJoiningService.leaveGame(user.id, currentGame.id)
      setCurrentGame(null)
      setUserTeam(null)
      setUserTeamMembership(null)
      setViewState('join-game')
      toast({
        title: 'Left Game',
        description: 'You have left the game.',
      })
    } catch (err) {
      toast({
        title: 'Failed to Leave',
        description: err instanceof Error ? err.message : 'Could not leave game',
        variant: 'destructive',
      })
    }
  }

  const handleLeaveTeam = async () => {
    if (!userTeam || !user) return

    try {
      await teamService.leaveTeam(user.id, userTeam.id)
      setUserTeam(null)
      setUserTeamMembership(null)
      toast({
        title: 'Left Team',
        description: 'You have left the team.',
      })
    } catch (err) {
      toast({
        title: 'Failed to Leave Team',
        description: err instanceof Error ? err.message : 'Could not leave team',
        variant: 'destructive',
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please log in to join a game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Player Dashboard</h1>
              <p className="text-muted-foreground">
                {currentGame ? `Playing in: ${currentGame.name}` : 'Join a game to get started'}
              </p>
            </div>
            <div className="flex gap-2">
              {currentGame && (
                <Button variant="outline" onClick={handleLeaveGame}>
                  Leave Game
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Game Status */}
          {currentGame && userTeam && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Your Team: {userTeam.name}
                </CardTitle>
                <CardDescription>
                  Team #{userTeam.team_number} • {userTeamMembership?.is_captain ? 'Team Captain' : 'Team Member'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant={currentGame.status === 'setup' ? 'secondary' : 'default'}>
                      {currentGame.status === 'setup' ? 'Waiting to Start' : 'In Progress'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Game Code: <span className="font-mono font-bold">{currentGame.code}</span>
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLeaveTeam}>
                    Leave Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          {!currentGame ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Gamepad2 className="h-6 w-6" />
                    Join a Trivia Game
                  </CardTitle>
                  <CardDescription>
                    Enter a game code from your host to get started
                  </CardDescription>
                </CardHeader>
              </Card>

              <GameJoinForm
                user={user}
                onGameJoined={() => checkExistingGameMembership()}
              />
            </div>
          ) : (
            <Tabs value={viewState} onValueChange={(value) => setViewState(value as ViewState)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="team-list" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Teams
                </TabsTrigger>
                <TabsTrigger value="create-team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Create Team
                </TabsTrigger>
              </TabsList>

              <TabsContent value="team-list" className="mt-6">
                <TeamList
                  gameId={currentGame.id}
                  user={user}
                  onTeamJoined={handleTeamJoined}
                  onCreateTeam={() => setViewState('create-team')}
                />
              </TabsContent>

              <TabsContent value="create-team" className="mt-6">
                <TeamCreationForm
                  gameId={currentGame.id}
                  user={user}
                  onTeamCreated={handleTeamCreated}
                  onCancel={() => setViewState('team-list')}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
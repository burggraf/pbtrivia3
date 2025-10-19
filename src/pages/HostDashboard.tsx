import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GameWizard } from '@/components/host/GameWizard'
import { GameCreationForm } from '@/components/host/GameCreationForm'
import { useToast } from '@/hooks/use-toast'
import { useGameStore } from '@/stores/gameStore'
import { gameService } from '@/services/game/gameService'
import { playButtonClick } from '@/services/sound/soundService'
import type { Game } from '@/types'
import { Plus, Play, Pause, Users, Clock, Trophy, Settings, Trash2, Eye, Target } from 'lucide-react'

export function HostDashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user, currentGame, setCurrentGame } = useGameStore()

  const [isCreatingGame, setIsCreatingGame] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [myGames, setMyGames] = useState<Game[]>([])
  const [isLoadingGames, setIsLoadingGames] = useState(true)

  // Load host's games
  useEffect(() => {
    if (user) {
      loadMyGames()
    }
  }, [user])

  const loadMyGames = async () => {
    if (!user) return

    setIsLoadingGames(true)
    try {
      const games = await gameService.getHostGames(user.id)
      setMyGames(games)
    } catch (error) {
      console.error('Failed to load games:', error)
      toast({
        title: 'Failed to Load Games',
        description: 'Could not load your existing games.',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingGames(false)
    }
  }

  const handleCreateGame = () => {
    playButtonClick()
    setShowWizard(true)
  }

  const handleGameCreated = (gameId: string) => {
    setIsCreatingGame(false)
    setShowWizard(false)
    loadMyGames() // Refresh games list
    navigate(`/host/game/${gameId}`)
  }

  const handleCancelCreation = () => {
    playButtonClick()
    setIsCreatingGame(false)
    setShowWizard(false)
  }

  const handleStartGame = async (gameId: string) => {
    try {
      playButtonClick()
      const game = await gameService.startGame(gameId)
      setCurrentGame(game)

      toast({
        title: 'Game Started!',
        description: 'The game is now live and players can join.',
      })

      // Navigate to game management view
      navigate(`/host/game/${gameId}`)
    } catch (error) {
      console.error('Failed to start game:', error)
      toast({
        title: 'Failed to Start Game',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handlePauseGame = async (gameId: string) => {
    try {
      playButtonClick()
      const game = await gameService.pauseGame(gameId)
      setCurrentGame(game)

      toast({
        title: 'Game Paused',
        description: 'The game has been paused.',
      })
    } catch (error) {
      console.error('Failed to pause game:', error)
      toast({
        title: 'Failed to Pause Game',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleResumeGame = async (gameId: string) => {
    try {
      playButtonClick()
      const game = await gameService.resumeGame(gameId)
      setCurrentGame(game)

      toast({
        title: 'Game Resumed',
        description: 'The game has been resumed.',
      })
    } catch (error) {
      console.error('Failed to resume game:', error)
      toast({
        title: 'Failed to Resume Game',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return
    }

    try {
      playButtonClick()
      await gameService.deleteGame(gameId)

      toast({
        title: 'Game Deleted',
        description: 'The game has been permanently deleted.',
      })

      // Refresh games list
      loadMyGames()

      // If this was the current game, clear it
      if (currentGame?.id === gameId) {
        setCurrentGame(null)
      }
    } catch (error) {
      console.error('Failed to delete game:', error)
      toast({
        title: 'Failed to Delete Game',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
    }
  }

  const handleViewGame = (gameId: string) => {
    playButtonClick()
    navigate(`/host/game/${gameId}`)
  }

  const getStatusBadge = (game: Game) => {
    const statusConfig = {
      setup: { label: 'Setup', variant: 'secondary' as const },
      in_progress: { label: 'Live', variant: 'default' as const },
      paused: { label: 'Paused', variant: 'outline' as const },
      completed: { label: 'Completed', variant: 'secondary' as const },
    }

    const config = statusConfig[game.status] || statusConfig.setup
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatGameDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Show game creation wizard
  if (showWizard) {
    return (
      <div className="min-h-screen bg-background">
        <GameWizard
          onComplete={handleGameCreated}
          onCancel={handleCancelCreation}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Game Dashboard</h1>
          <p className="text-muted-foreground">Create and manage your trivia games</p>
        </div>
        <Button onClick={handleCreateGame} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create New Game
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{myGames.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Games</p>
                <p className="text-2xl font-bold">
                  {myGames.filter(game => game.status === 'in_progress').length}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Setup Games</p>
                <p className="text-2xl font-bold">
                  {myGames.filter(game => game.status === 'setup').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {myGames.filter(game => game.status === 'completed').length}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="games" className="space-y-6">
        <TabsList>
          <TabsTrigger value="games">My Games</TabsTrigger>
          <TabsTrigger value="create">Quick Create</TabsTrigger>
          <TabsTrigger value="templates">Game Templates</TabsTrigger>
        </TabsList>

        {/* Games List */}
        <TabsContent value="games" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Games</h2>
            <Button variant="outline" onClick={loadMyGames} disabled={isLoadingGames}>
              {isLoadingGames ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {isLoadingGames ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your games...</p>
            </div>
          ) : myGames.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first trivia game to get started!
                </p>
                <Button onClick={handleCreateGame}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Game
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myGames.map((game) => (
                <Card key={game.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{game.title}</h3>
                          {getStatusBadge(game)}
                        </div>
                        {game.description && (
                          <p className="text-sm text-muted-foreground mb-3">{game.description}</p>
                        )}
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {game.max_teams} teams
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {game.round_count} rounds
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatGameDate(game.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {game.status === 'setup' && (
                          <Button
                            size="sm"
                            onClick={() => handleStartGame(game.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {game.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePauseGame(game.id)}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        {game.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResumeGame(game.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewGame(game.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        {game.status === 'setup' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteGame(game.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {game.game_code && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Game Code:</span>
                            <Badge variant="secondary" className="font-mono text-lg">
                              {game.game_code}
                            </Badge>
                          </div>
                          {game.status === 'in_progress' && (
                            <span className="text-sm text-green-600 font-medium">Players can join now!</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quick Create */}
        <TabsContent value="create" className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Quick Game Creation</h2>
            <p className="text-muted-foreground mb-6">
              Create a new game with our streamlined setup process
            </p>
            <GameCreationForm onSuccess={handleGameCreated} onCancel={handleCancelCreation} />
          </div>
        </TabsContent>

        {/* Game Templates */}
        <TabsContent value="templates" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Game Templates</h2>
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  <p className="mb-4">Game templates coming soon!</p>
                  <p className="text-sm">Pre-configured game setups for different occasions and difficulty levels.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default HostDashboard
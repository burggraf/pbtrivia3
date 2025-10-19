import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { gameService } from '@/services/game/gameService'
import type { Game } from '@/types'

export function PlayerJoinPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [gameCode, setGameCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [foundGame, setFoundGame] = useState<Game | null>(null)

  const handleSearchGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gameCode.trim()) {
      toast({
        title: 'Game Code Required',
        description: 'Please enter a game code.',
        variant: 'destructive',
      })
      return
    }

    setIsSearching(true)
    try {
      const game = await gameService.getGameByCode(gameCode.trim().toUpperCase())
      if (game) {
        setFoundGame(game)
        toast({
          title: 'Game Found!',
          description: `"${game.title}" is ready to join.`,
        })
      } else {
        setFoundGame(null)
        toast({
          title: 'Game Not Found',
          description: 'No game found with that code. Please check and try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setFoundGame(null)
      toast({
        title: 'Search Failed',
        description: 'Unable to search for game. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleJoinGame = () => {
    if (!foundGame || !user) return

    // For now, just navigate to a placeholder game view
    navigate(`/player/game/${foundGame.game_code}`)
    toast({
      title: 'Joined Game!',
      description: `You've joined "${foundGame.title}"`,
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      setup: { label: 'Waiting to Start', variant: 'secondary' as const },
      in_progress: { label: 'Live Now', variant: 'default' as const },
      paused: { label: 'Paused', variant: 'outline' as const },
      completed: { label: 'Completed', variant: 'secondary' as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.setup
    return <Badge variant={config.variant}>{config.label}</Badge>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join Trivia Game</h1>
            <p className="text-muted-foreground">Enter the game code provided by your host</p>
          </div>

          {/* Search Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Enter Game Code</CardTitle>
              <CardDescription>
                Ask your host for the 6-character game code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchGame} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., ABC123"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="font-mono text-center text-lg"
                    disabled={isSearching}
                  />
                  <Button type="submit" disabled={isSearching || !gameCode.trim()}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Game Results */}
          {foundGame && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{foundGame.title}</CardTitle>
                  {getStatusBadge(foundGame.status)}
                </div>
                {foundGame.description && (
                  <CardDescription>{foundGame.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Game Code:</span>
                    <div className="font-mono font-bold">{foundGame.game_code}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Host:</span>
                    <div className="font-medium">Game Host</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Teams:</span>
                    <div className="font-medium">{foundGame.max_teams || foundGame.max_team_size}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Players per Team:</span>
                    <div className="font-medium">{foundGame.team_size || foundGame.min_team_size}-{foundGame.max_team_size}</div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Game Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rounds:</span>
                      <div className="font-medium">{foundGame.round_count || 5}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time per Question:</span>
                      <div className="font-medium">{foundGame.time_limit_seconds || 30}s</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleJoinGame} className="flex-1">
                    Join Game
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFoundGame(null)
                      setGameCode('')
                    }}
                  >
                    Search Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Demo Games */}
          {!foundGame && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Try Demo Games</CardTitle>
                <CardDescription>
                  Join these demo games to test the player experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Sample Trivia Night</div>
                      <div className="text-sm text-muted-foreground">Code: DEMO123</div>
                    </div>
                    <Badge variant="secondary">Setup</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Quick Quiz Challenge</div>
                      <div className="text-sm text-muted-foreground">Code: QUIZ456</div>
                    </div>
                    <Badge variant="default">Live</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Back Button */}
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
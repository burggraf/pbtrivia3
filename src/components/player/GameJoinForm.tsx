/**
 * Game Join Form Component
 * Allows players to find and join games using game codes
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Gamepad2 } from 'lucide-react'
import { gameJoiningService } from '@/services/player/gameJoiningService'
import type { User } from '@/types/user'

interface GameJoinFormProps {
  user: User
  onGameJoined: () => void
}

export function GameJoinForm({ user, onGameJoined }: GameJoinFormProps) {
  const [gameCode, setGameCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const teamMember = await gameJoiningService.joinGame(user, gameCode.trim().toUpperCase())
      setSuccess(`Successfully joined game!`)
      setGameCode('')
      setTimeout(() => {
        onGameJoined()
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Gamepad2 className="h-6 w-6" />
          Join Game
        </CardTitle>
        <CardDescription>
          Enter the game code provided by your host
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameCode">Game Code</Label>
            <Input
              id="gameCode"
              type="text"
              placeholder="e.g., ABC123"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="text-center text-lg font-mono uppercase"
              disabled={isLoading}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !gameCode.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Join Game'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Ask your host for the game code to join their trivia session.</p>
        </div>
      </CardContent>
    </Card>
  )
}
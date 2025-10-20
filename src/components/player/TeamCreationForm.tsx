/**
 * Team Creation Form Component
 * Allows players to create new teams in a game
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, ArrowLeft } from 'lucide-react'
import { teamService } from '@/services/player/teamService'
import type { User } from '@/types/user'

interface TeamCreationFormProps {
  gameId: string
  user: User
  onTeamCreated: () => void
  onCancel: () => void
}

export function TeamCreationForm({ gameId, user, onTeamCreated, onCancel }: TeamCreationFormProps) {
  const [teamName, setTeamName] = useState('')
  const [teamNumber, setTeamNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const teamData = {
        game_id: gameId,
        name: teamName.trim(),
        team_number: parseInt(teamNumber)
      }

      await teamService.createTeam(teamData)

      // User automatically becomes captain when creating a team
      // The service should handle creating the team member record
      onTeamCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = teamName.trim().length > 0 &&
                     teamNumber.trim().length > 0 &&
                     parseInt(teamNumber) >= 1 &&
                     parseInt(teamNumber) <= 10

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          Create Team
        </CardTitle>
        <CardDescription>
          Create a new team and invite other players to join
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name</Label>
            <Input
              id="teamName"
              type="text"
              placeholder="e.g., The Quizzers"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              maxLength={50}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamNumber">Team Number</Label>
            <Input
              id="teamNumber"
              type="number"
              min="1"
              max="10"
              placeholder="1-10"
              value={teamNumber}
              onChange={(e) => setTeamNumber(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              Choose a unique number between 1 and 10
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">Team Creation Tips:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• You'll automatically become the team captain</li>
            <li>• Other players can join your team once it's created</li>
            <li>• Choose a memorable name and unique number</li>
            <li>• Teams can have up to 10 players</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
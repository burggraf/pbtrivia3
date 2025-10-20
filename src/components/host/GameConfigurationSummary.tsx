import React from 'react'
import type { Game, Round, Question } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Settings,
  Users,
  Clock,
  Volume2,
  Gamepad2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

interface GameConfigurationSummaryProps {
  game: Game
  rounds: Round[]
  questions: Question[]
  onStartGame?: () => void
  onEditSettings?: () => void
  onEditRounds?: () => void
  isValid?: boolean
  className?: string
}

export const GameConfigurationSummary: React.FC<GameConfigurationSummaryProps> = ({
  game,
  rounds,
  questions,
  onStartGame,
  onEditSettings,
  onEditRounds,
  isValid = true,
  className = ''
}) => {
  const totalQuestions = rounds.reduce((sum, round) => sum + round.num_questions, 0)
  const categories = [...new Set(rounds.flatMap(round => round.categories))]

  const formatTimeLimit = (seconds?: number) => {
    if (!seconds) return 'No time limit'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (valid: boolean) => {
    return valid ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
  }

  const getStatusIcon = (valid: boolean) => {
    return valid ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Game Status
            <span className={getStatusColor(isValid)}>
              {getStatusIcon(isValid)}
              {isValid ? 'Ready to Start' : 'Configuration Needed'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={onStartGame}
              disabled={!isValid}
              size="lg"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Start Game
            </Button>
            <div className="text-sm text-muted-foreground">
              {isValid
                ? 'Your game is configured and ready to start!'
                : 'Please complete the required configuration before starting.'
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Game Settings
            </div>
            <Button variant="outline" size="sm" onClick={onEditSettings}>
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Basic Info</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Game Name:</dt>
                  <dd className="font-medium">{game.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Game Code:</dt>
                  <dd className="font-mono font-medium">{game.code}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status:</dt>
                  <dd>
                    <Badge
                      variant={
                        game.status === 'setup' ? 'secondary' :
                        game.status === 'live' ? 'default' :
                        game.status === 'completed' ? 'outline' : 'destructive'
                      }
                    >
                      {game.status}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h4 className="font-medium mb-2">Game Rules</h4>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Team Size:</dt>
                  <dd className="font-medium">{game.min_team_size}-{game.max_team_size} players</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Time Limit:</dt>
                  <dd className="font-medium">{formatTimeLimit(game.time_limit_seconds)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Sound Effects:</dt>
                  <dd className="flex items-center gap-1">
                    <Volume2 className="h-4 w-4" />
                    {game.sound_effects_enabled ? 'Enabled' : 'Disabled'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rounds Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Rounds Configuration
            </div>
            <Button variant="outline" size="sm" onClick={onEditRounds}>
              Edit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {rounds.length}
                </div>
                <div className="text-sm text-muted-foreground">Rounds</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {categories.length}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Round Details</h4>
              <div className="space-y-2">
                {rounds.map((round, index) => (
                  <div key={round.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-muted-foreground">
                        Round {round.round_number}
                      </span>
                      <span className="font-medium">{round.title}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{round.num_questions} questions</span>
                      <div className="flex gap-1">
                        {round.categories.slice(0, 2).map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                        {round.categories.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{round.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Issues */}
      {!isValid && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Configuration Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {rounds.length === 0 && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  • At least one round must be configured
                </p>
              )}
              {totalQuestions === 0 && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  • Questions must be selected for all rounds
                </p>
              )}
              {!game.name && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  • Game name is required
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default GameConfigurationSummary
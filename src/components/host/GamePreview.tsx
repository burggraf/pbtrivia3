import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Clock, Users, Trophy, Target, Zap, Volume2, Monitor, Edit } from 'lucide-react'
import type { GameCreationConfig } from '@/types'

interface GamePreviewProps {
  config: Partial<GameCreationConfig>
  onEdit?: () => void
  onCreate?: () => void
  isCreating?: boolean
}

// Available trivia categories
const TRIVIA_CATEGORIES = {
  general: 'General Knowledge',
  science: 'Science & Nature',
  history: 'History',
  geography: 'Geography',
  entertainment: 'Entertainment',
  sports: 'Sports',
  literature: 'Literature',
  technology: 'Technology',
  food: 'Food & Drink',
  music: 'Music',
}

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200',
}

export function GamePreview({ config, onEdit, onCreate, isCreating }: GamePreviewProps) {
  const totalQuestions = (config.round_count || 0) * (config.questions_per_round || 0)
  const maxPlayers = (config.max_teams || 0) * (config.team_size || 0)
  const estimatedDuration = Math.ceil((totalQuestions * (config.time_per_question || 30)) / 60)

  const getCategoryNames = () => {
    if (!config.category_ids || config.category_ids.length === 0) {
      return 'No categories selected'
    }

    return config.category_ids
      .map(id => TRIVIA_CATEGORIES[id as keyof typeof TRIVIA_CATEGORIES])
      .filter(Boolean)
      .join(', ')
  }

  const getDifficultyLabel = () => {
    return config.difficulty ? config.difficulty.charAt(0).toUpperCase() + config.difficulty.slice(1) : 'Not set'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{config.title || 'Untitled Game'}</h2>
        {config.description && (
          <p className="text-muted-foreground max-w-2xl mx-auto">{config.description}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{maxPlayers}</div>
            <div className="text-xs text-muted-foreground">Max Players</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{estimatedDuration}</div>
            <div className="text-xs text-muted-foreground">Minutes</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <div className="flex items-center justify-center mb-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{config.round_count || 0}</div>
            <div className="text-xs text-muted-foreground">Rounds</div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Game Structure */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Teams</span>
              <span className="font-medium">{config.max_teams} teams</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Players per Team</span>
              <span className="font-medium">{config.team_size} players</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rounds</span>
              <span className="font-medium">{config.round_count} rounds</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Questions per Round</span>
              <span className="font-medium">{config.questions_per_round} questions</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Questions</span>
              <span className="font-medium">{totalQuestions} questions</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated Duration</span>
              <span className="font-medium">{estimatedDuration} minutes</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories & Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Categories & Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Categories</div>
              <div className="flex flex-wrap gap-2">
                {config.category_ids?.map(categoryId => (
                  <Badge key={categoryId} variant="secondary">
                    {TRIVIA_CATEGORIES[categoryId as keyof typeof TRIVIA_CATEGORIES]}
                  </Badge>
                ))}
                {(!config.category_ids || config.category_ids.length === 0) && (
                  <span className="text-sm text-muted-foreground">No categories selected</span>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Difficulty</span>
              <Badge className={DIFFICULTY_COLORS[config.difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-gray-100 text-gray-800 border-gray-200'}>
                {getDifficultyLabel()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Time per Question</span>
                <span className="font-medium">{config.time_per_question} seconds</span>
              </div>
              <Progress
                value={(config.time_per_question || 0) / 3} // Max 300 seconds, so divide by 3 for percentage
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fast (10s)</span>
                <span>Normal (30s)</span>
                <span>Slow (60s+)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scoring System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Correct Answer</span>
              </div>
              <span className="font-medium">{config.point_values?.correct || 0} points</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Speed Bonus</span>
              </div>
              <span className="font-medium">{config.point_values?.speed_bonus || 0} points</span>
            </div>

            <Separator />

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Max Points per Round</div>
              <div className="text-2xl font-bold text-primary">
                {((config.point_values?.correct || 0) + (config.point_values?.speed_bonus || 0)) * (config.questions_per_round || 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Game Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Volume2 className={`h-4 w-4 ${config.enable_sound_effects ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">Sound Effects</span>
              {config.enable_sound_effects && <span className="text-xs text-green-600">✓</span>}
            </div>

            <div className="flex items-center gap-2">
              <Monitor className={`h-4 w-4 ${config.show_leaderboard ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">Leaderboard</span>
              {config.show_leaderboard && <span className="text-xs text-green-600">✓</span>}
            </div>

            <div className="flex items-center gap-2">
              <Edit className={`h-4 w-4 ${config.allow_team_names ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">Custom Names</span>
              {config.allow_team_names && <span className="text-xs text-green-600">✓</span>}
            </div>

            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${config.enable_powerups ? 'text-green-600' : 'text-gray-400'}`} />
              <span className="text-sm">Power-ups</span>
              {config.enable_powerups && <span className="text-xs text-green-600">✓</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      <Card className={config.category_ids && config.category_ids.length > 0 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            {config.category_ids && config.category_ids.length > 0 ? (
              <>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-800">
                  Ready to create! Your game is properly configured.
                </span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-yellow-800">
                  Please select at least one category before creating the game.
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {onCreate && (
        <div className="flex justify-center gap-4">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Configuration
            </Button>
          )}
          <Button
            onClick={onCreate}
            disabled={!config.category_ids || config.category_ids.length === 0 || isCreating}
            className="min-w-32"
          >
            {isCreating ? 'Creating...' : 'Create Game'}
          </Button>
        </div>
      )}
    </div>
  )
}

export default GamePreview
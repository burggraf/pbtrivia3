import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useGameStore } from '@/stores/gameStore'
import { gameService } from '@/services/game/gameService'
import type { GameCreationConfig } from '@/types'

// Game creation form schema
const gameConfigSchema = z.object({
  title: z.string().min(3, 'Game title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category_ids: z.array(z.string()).min(1, 'Select at least one category'),
  max_teams: z.number().min(2, 'Minimum 2 teams').max(20, 'Maximum 20 teams'),
  team_size: z.number().min(1, 'Minimum 1 player per team').max(10, 'Maximum 10 players per team'),
  round_count: z.number().min(1, 'Minimum 1 round').max(10, 'Maximum 10 rounds'),
  questions_per_round: z.number().min(1, 'Minimum 1 question').max(20, 'Maximum 20 questions'),
  time_per_question: z.number().min(10, 'Minimum 10 seconds').max(300, 'Maximum 5 minutes'),
  point_values: z.object({
    correct: z.number().min(10, 'Minimum 10 points').max(1000, 'Maximum 1000 points'),
    speed_bonus: z.number().min(0, 'Minimum 0').max(500, 'Maximum 500 bonus points'),
  }),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  enable_powerups: z.boolean(),
  enable_sound_effects: z.boolean(),
  show_leaderboard: z.boolean(),
  allow_team_names: z.boolean(),
})

type GameConfigFormData = z.infer<typeof gameConfigSchema>

// Available trivia categories
const TRIVIA_CATEGORIES = [
  { id: 'general', name: 'General Knowledge', description: 'Mixed trivia questions' },
  { id: 'science', name: 'Science & Nature', description: 'Physics, chemistry, biology, and more' },
  { id: 'history', name: 'History', description: 'World history, historical events, and figures' },
  { id: 'geography', name: 'Geography', description: 'Countries, capitals, and geographic features' },
  { id: 'entertainment', name: 'Entertainment', description: 'Movies, TV, music, and celebrities' },
  { id: 'sports', name: 'Sports', description: 'Athletics, competitions, and sports history' },
  { id: 'literature', name: 'Literature', description: 'Books, authors, and literary works' },
  { id: 'technology', name: 'Technology', description: 'Computers, internet, and modern tech' },
  { id: 'food', name: 'Food & Drink', description: 'Cuisine, cooking, and beverages' },
  { id: 'music', name: 'Music', description: 'Songs, artists, and music theory' },
]

interface GameCreationFormProps {
  onSuccess?: (gameId: string) => void
  onCancel?: () => void
}

export function GameCreationForm({ onSuccess, onCancel }: GameCreationFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setCurrentGame, user } = useGameStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const form = useForm<GameConfigFormData>({
    resolver: zodResolver(gameConfigSchema),
    defaultValues: {
      title: '',
      description: '',
      category_ids: [],
      max_teams: 6,
      team_size: 4,
      round_count: 5,
      questions_per_round: 3,
      time_per_question: 30,
      point_values: {
        correct: 100,
        speed_bonus: 50,
      },
      difficulty: 'medium',
      enable_powerups: false,
      enable_sound_effects: true,
      show_leaderboard: true,
      allow_team_names: true,
    },
  })

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const newCategories = checked
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter(id => id !== categoryId)

    setSelectedCategories(newCategories)
    form.setValue('category_ids', newCategories)
  }

  const onSubmit = async (data: GameConfigFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a game.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Create the game using game service
      const gameConfig: GameCreationConfig = {
        ...data,
        host_id: user.id,
        status: 'setup' as const,
        game_code: '', // Will be generated by gameService
        current_round: 1,
        current_question: 1,
        is_paused: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const game = await gameService.createGame(gameConfig)

      // Update game store
      setCurrentGame(game)

      toast({
        title: 'Game Created!',
        description: `"${data.title}" has been created successfully.`,
      })

      // Call success callback or navigate to game dashboard
      if (onSuccess) {
        onSuccess(game.id)
      } else {
        navigate(`/host/game/${game.id}`)
      }
    } catch (error) {
      console.error('Failed to create game:', error)
      toast({
        title: 'Failed to Create Game',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchedValues = form.watch()

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Create New Trivia Game</h1>
        <p className="text-muted-foreground">Configure your trivia game settings</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Give your trivia game a name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Game Title *</Label>
              <Input
                id="title"
                {...form.register('title')}
                placeholder="e.g., Friday Night Trivia"
                disabled={isSubmitting}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Brief description of your trivia game..."
                rows={3}
                disabled={isSubmitting}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Trivia Categories *</CardTitle>
            <CardDescription>
              Select at least one category for your questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRIVIA_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle(category.id, checked as boolean)
                    }
                    disabled={isSubmitting}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor={category.id}
                      className="font-medium cursor-pointer"
                    >
                      {category.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.category_ids && (
              <p className="text-sm text-destructive mt-2">{form.formState.errors.category_ids.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Game Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Game Structure</CardTitle>
            <CardDescription>
              Configure the number of teams, rounds, and questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max_teams">Maximum Teams</Label>
                <Select
                  value={watchedValues.max_teams.toString()}
                  onValueChange={(value) => form.setValue('max_teams', parseInt(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} teams
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.max_teams && (
                  <p className="text-sm text-destructive">{form.formState.errors.max_teams.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="team_size">Players per Team</Label>
                <Select
                  value={watchedValues.team_size.toString()}
                  onValueChange={(value) => form.setValue('team_size', parseInt(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} players
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.team_size && (
                  <p className="text-sm text-destructive">{form.formState.errors.team_size.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="round_count">Number of Rounds</Label>
                <Select
                  value={watchedValues.round_count.toString()}
                  onValueChange={(value) => form.setValue('round_count', parseInt(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} round{num !== 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.round_count && (
                  <p className="text-sm text-destructive">{form.formState.errors.round_count.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="questions_per_round">Questions per Round</Label>
                <Select
                  value={watchedValues.questions_per_round.toString()}
                  onValueChange={(value) => form.setValue('questions_per_round', parseInt(value))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.questions_per_round && (
                  <p className="text-sm text-destructive">{form.formState.errors.questions_per_round.message}</p>
                )}
              </div>
            </div>

            {/* Game Statistics */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Game Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Questions:</span>
                  <div className="font-medium">
                    {watchedValues.round_count * watchedValues.questions_per_round}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Max Players:</span>
                  <div className="font-medium">
                    {watchedValues.max_teams * watchedValues.team_size}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Est. Duration:</span>
                  <div className="font-medium">
                    ~{Math.ceil((watchedValues.round_count * watchedValues.questions_per_round * watchedValues.time_per_question) / 60)} min
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Categories:</span>
                  <div className="font-medium">
                    {selectedCategories.length} selected
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing and Difficulty */}
        <Card>
          <CardHeader>
            <CardTitle>Timing & Difficulty</CardTitle>
            <CardDescription>
              Set question time limits and difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="time_per_question">
                Time per Question: {watchedValues.time_per_question} seconds
              </Label>
              <Slider
                id="time_per_question"
                min={10}
                max={300}
                step={5}
                value={[watchedValues.time_per_question]}
                onValueChange={([value]) => form.setValue('time_per_question', value)}
                disabled={isSubmitting}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10s</span>
                <span>2.5 min</span>
                <span>5 min</span>
              </div>
              {form.formState.errors.time_per_question && (
                <p className="text-sm text-destructive">{form.formState.errors.time_per_question.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={watchedValues.difficulty}
                onValueChange={(value) => form.setValue('difficulty', value as 'easy' | 'medium' | 'hard')}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Easy</Badge>
                      <span>Simple questions, longer time</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Medium</Badge>
                      <span>Balanced difficulty</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="hard">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Hard</Badge>
                      <span>Challenging questions, shorter time</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.difficulty && (
                <p className="text-sm text-destructive">{form.formState.errors.difficulty.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scoring */}
        <Card>
          <CardHeader>
            <CardTitle>Scoring System</CardTitle>
            <CardDescription>
              Configure points for correct answers and bonuses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="correct_points">
                  Points per Correct Answer: {watchedValues.point_values.correct}
                </Label>
                <Slider
                  id="correct_points"
                  min={10}
                  max={1000}
                  step={10}
                  value={[watchedValues.point_values.correct]}
                  onValueChange={([value]) =>
                    form.setValue('point_values.correct', value)
                  }
                  disabled={isSubmitting}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10 pts</span>
                  <span>500 pts</span>
                  <span>1000 pts</span>
                </div>
                {form.formState.errors.point_values?.correct && (
                  <p className="text-sm text-destructive">{form.formState.errors.point_values.correct.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed_bonus">
                  Speed Bonus: {watchedValues.point_values.speed_bonus}
                </Label>
                <Slider
                  id="speed_bonus"
                  min={0}
                  max={500}
                  step={10}
                  value={[watchedValues.point_values.speed_bonus]}
                  onValueChange={([value]) =>
                    form.setValue('point_values.speed_bonus', value)
                  }
                  disabled={isSubmitting}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>No bonus</span>
                  <span>250 pts</span>
                  <span>500 pts</span>
                </div>
                {form.formState.errors.point_values?.speed_bonus && (
                  <p className="text-sm text-destructive">{form.formState.errors.point_values.speed_bonus.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Game Options */}
        <Card>
          <CardHeader>
            <CardTitle>Game Options</CardTitle>
            <CardDescription>
              Additional gameplay features and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_sound_effects">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for correct answers, timers, and game events
                  </p>
                </div>
                <Checkbox
                  id="enable_sound_effects"
                  checked={watchedValues.enable_sound_effects}
                  onCheckedChange={(checked) =>
                    form.setValue('enable_sound_effects', checked as boolean)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show_leaderboard">Show Leaderboard</Label>
                  <p className="text-sm text-muted-foreground">
                    Display team rankings between rounds
                  </p>
                </div>
                <Checkbox
                  id="show_leaderboard"
                  checked={watchedValues.show_leaderboard}
                  onCheckedChange={(checked) =>
                    form.setValue('show_leaderboard', checked as boolean)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_team_names">Custom Team Names</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow players to set their own team names
                  </p>
                </div>
                <Checkbox
                  id="allow_team_names"
                  checked={watchedValues.allow_team_names}
                  onCheckedChange={(checked) =>
                    form.setValue('allow_team_names', checked as boolean)
                  }
                  disabled={isSubmitting}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_powerups">Power-ups (Experimental)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable special abilities teams can use during gameplay
                  </p>
                </div>
                <Checkbox
                  id="enable_powerups"
                  checked={watchedValues.enable_powerups}
                  onCheckedChange={(checked) =>
                    form.setValue('enable_powerups', checked as boolean)
                  }
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || selectedCategories.length === 0}
            className="min-w-32"
          >
            {isSubmitting ? 'Creating...' : 'Create Game'}
          </Button>
        </div>
      </form>
    </div>
  )
}
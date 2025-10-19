import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useGameStore } from '@/stores/gameStore'
import { GameCreationForm } from './GameCreationForm'
import { GamePreview } from './GamePreview'
import { playButtonClick, playGameStart } from '@/services/sound/soundService'
import type { GameCreationConfig } from '@/types'

// Wizard steps
const WIZARD_STEPS = [
  { id: 'basic', title: 'Basic Info', description: 'Game title and description' },
  { id: 'categories', title: 'Categories', description: 'Select trivia categories' },
  { id: 'structure', title: 'Game Structure', description: 'Teams, rounds, and questions' },
  { id: 'timing', title: 'Timing & Difficulty', description: 'Time limits and difficulty level' },
  { id: 'scoring', title: 'Scoring', description: 'Points and bonuses' },
  { id: 'options', title: 'Game Options', description: 'Additional features' },
  { id: 'preview', title: 'Preview', description: 'Review and create game' },
] as const

type WizardStep = typeof WIZARD_STEPS[number]['id']

interface GameWizardProps {
  onComplete?: (gameId: string) => void
  onCancel?: () => void
  initialConfig?: Partial<GameCreationConfig>
}

export function GameWizard({ onComplete, onCancel, initialConfig }: GameWizardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { setCurrentGame, user } = useGameStore()

  const [currentStep, setCurrentStep] = useState<WizardStep>('basic')
  const [gameConfig, setGameConfig] = useState<Partial<GameCreationConfig>>(initialConfig || {})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep)
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100

  // Check if current step is valid
  const isStepValid = useCallback((): boolean => {
    switch (currentStep) {
      case 'basic':
        return Boolean(gameConfig.title && gameConfig.title?.length >= 3)

      case 'categories':
        return Boolean(gameConfig.category_ids && gameConfig.category_ids.length > 0)

      case 'structure':
        return Boolean(
          gameConfig.max_teams &&
          gameConfig.max_teams >= 2 &&
          gameConfig.team_size &&
          gameConfig.team_size >= 1 &&
          gameConfig.round_count &&
          gameConfig.round_count >= 1 &&
          gameConfig.questions_per_round &&
          gameConfig.questions_per_round >= 1
        )

      case 'timing':
        return Boolean(
          gameConfig.time_per_question &&
          gameConfig.time_per_question >= 10 &&
          gameConfig.difficulty
        )

      case 'scoring':
        return Boolean(
          gameConfig.point_values?.correct &&
          gameConfig.point_values.correct >= 10
        )

      case 'options':
        return true // Options are always valid (they have defaults)

      case 'preview':
        return true // Preview step doesn't need validation

      default:
        return false
    }
  }, [currentStep, gameConfig])

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    if (!isStepValid()) {
      toast({
        title: 'Incomplete Information',
        description: 'Please complete all required fields before proceeding.',
        variant: 'destructive',
      })
      return
    }

    const nextStepIndex = currentStepIndex + 1
    if (nextStepIndex < WIZARD_STEPS.length) {
      playButtonClick()
      setCurrentStep(WIZARD_STEPS[nextStepIndex].id)
    }
  }, [currentStepIndex, isStepValid, toast])

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    playButtonClick()
    const prevStepIndex = currentStepIndex - 1
    if (prevStepIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevStepIndex].id)
    }
  }, [currentStepIndex])

  // Jump to specific step
  const goToStep = useCallback((stepId: WizardStep) => {
    const stepIndex = WIZARD_STEPS.findIndex(step => step.id === stepId)
    if (stepIndex >= 0 && stepIndex <= currentStepIndex) {
      playButtonClick()
      setCurrentStep(stepId)
    }
  }, [currentStepIndex])

  // Handle configuration update
  const handleConfigUpdate = useCallback((updates: Partial<GameCreationConfig>) => {
    setGameConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // Handle game creation
  const handleCreateGame = useCallback(async (finalConfig: GameCreationConfig) => {
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
      playGameStart()

      // Import gameService dynamically to avoid circular dependency
      const { gameService } = await import('@/services/game/gameService')

      const game = await gameService.createGame(finalConfig)

      // Update game store
      setCurrentGame(game)

      toast({
        title: 'Game Created Successfully!',
        description: `"${finalConfig.title}" is ready to start.`,
      })

      // Call completion callback or navigate
      if (onComplete) {
        onComplete(game.id)
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
  }, [user, toast, setCurrentGame, onComplete, navigate])

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep config={gameConfig} onUpdate={handleConfigUpdate} />

      case 'categories':
        return <CategoriesStep config={gameConfig} onUpdate={handleConfigUpdate} />

      case 'structure':
        return <StructureStep config={gameConfig} onUpdate={handleConfigUpdate} />

      case 'timing':
        return <TimingStep config={gameConfig} onUpdate={handleConfigUpdate} />

      case 'scoring':
        return <ScoringStep config={gameConfig} onUpdate={handleConfigUpdate} />

      case 'options':
        return <OptionsStep config={gameConfig} onUpdate={handleConfigUpdate} />

      case 'preview':
        return <PreviewStep config={gameConfig} onUpdate={handleConfigUpdate} onCreate={handleCreateGame} />

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Trivia Game</h1>
        <p className="text-muted-foreground">Set up your trivia game step by step</p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStepIndex + 1} of {WIZARD_STEPS.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap gap-2 justify-center">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.id === currentStep
          const isCompleted = index < currentStepIndex
          const isAccessible = index <= currentStepIndex

          return (
            <Button
              key={step.id}
              variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => goToStep(step.id)}
              disabled={!isAccessible}
              className="min-w-24"
            >
              {isCompleted ? '✓' : index + 1}. {step.title}
            </Button>
          )
        })}
      </div>

      {/* Current Step Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Badge variant="outline">{currentStepIndex + 1}</Badge>
            {WIZARD_STEPS[currentStepIndex].title}
          </CardTitle>
          <CardDescription>
            {WIZARD_STEPS[currentStepIndex].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isSubmitting}
            >
              ← Previous
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        <div className="flex gap-2">
          {currentStep === 'preview' ? (
            <Button
              onClick={() => {
                const finalConfig = createFinalConfig(gameConfig)
                handleCreateGame(finalConfig)
              }}
              disabled={!isStepValid() || isSubmitting}
              className="min-w-32"
            >
              {isSubmitting ? 'Creating...' : 'Create Game'}
            </Button>
          ) : (
            <Button
              onClick={goToNextStep}
              disabled={!isStepValid()}
              className="min-w-24"
            >
              Next →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper to create final config from partial config
function createFinalConfig(config: Partial<GameCreationConfig>): GameCreationConfig {
  const { user } = useGameStore.getState()

  if (!user) {
    throw new Error('User must be authenticated to create a game')
  }

  return {
    title: config.title || '',
    description: config.description || '',
    host_id: user.id,
    status: 'setup',
    game_code: '', // Will be generated by gameService
    category_ids: config.category_ids || [],
    max_teams: config.max_teams || 6,
    team_size: config.team_size || 4,
    round_count: config.round_count || 5,
    questions_per_round: config.questions_per_round || 3,
    time_per_question: config.time_per_question || 30,
    point_values: config.point_values || {
      correct: 100,
      speed_bonus: 50,
    },
    difficulty: config.difficulty || 'medium',
    enable_powerups: config.enable_powerups || false,
    enable_sound_effects: config.enable_sound_effects ?? true,
    show_leaderboard: config.show_leaderboard ?? true,
    allow_team_names: config.allow_team_names ?? true,
    current_round: 1,
    current_question: 1,
    is_paused: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// Individual step components would go here...
// For now, I'll create placeholder components that will be implemented next

function BasicInfoStep({ config, onUpdate }: { config: Partial<GameCreationConfig>; onUpdate: (updates: Partial<GameCreationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Basic info step implementation would go here...
      </div>
    </div>
  )
}

function CategoriesStep({ config, onUpdate }: { config: Partial<GameCreationConfig>; onUpdate: (updates: Partial<GameCreationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Categories step implementation would go here...
      </div>
    </div>
  )
}

function StructureStep({ config, onUpdate }: { config: Partial<GameCreationConfig>; onUpdate: (updates: Partial<GameCreationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Structure step implementation would go here...
      </div>
    </div>
  )
}

function TimingStep({ config, onUpdate }: { config: Partial<GameCreationConfig>; onUpdate: (updates: Partial<GameCreationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Timing step implementation would go here...
      </div>
    </div>
  )
}

function ScoringStep({ config, onUpdate }: { config: Partial<GameCreationConfig>; onUpdate: (updates: Partial<GameCreationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Scoring step implementation would go here...
      </div>
    </div>
  )
}

function OptionsStep({ config, onUpdate }: { config: Partial<GameCreationConfig>; onUpdate: (updates: Partial<GameCreationConfig>) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Options step implementation would go here...
      </div>
    </div>
  )
}

function PreviewStep({
  config,
  onUpdate,
  onCreate
}: {
  config: Partial<GameCreationConfig>;
  onUpdate: (updates: Partial<GameCreationConfig>) => void;
  onCreate: (config: GameCreationConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <GamePreview config={config} />
    </div>
  )
}

export default GameWizard
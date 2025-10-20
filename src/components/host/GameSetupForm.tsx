import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw } from 'lucide-react';
import { gameService } from '@/services/game/gameService';
import { useAuth } from '@/contexts/AuthContext';
import type { Game, CreateGameData } from '@/types/game';

interface GameSetupFormProps {
  onGameCreated: (game: Game) => void;
}

export function GameSetupForm({ onGameCreated }: GameSetupFormProps) {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<CreateGameData>({
    name: '',
    host_id: '', // Will be set when user is available
    min_team_size: 1,
    max_team_size: 6,
    time_limit_enabled: false,
    time_limit_seconds: 60,
    sound_effects_enabled: true,
  });

  const [gameCode, setGameCode] = useState<string>(() => gameService.generateGameCode());
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateNewCode = useCallback(() => {
    const newCode = gameService.generateGameCode();
    setGameCode(newCode);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Game name is required';
    }

    if (formData.min_team_size > formData.max_team_size) {
      newErrors.teamSize = 'Minimum team size cannot be greater than maximum';
    }

    if (formData.time_limit_enabled && formData.time_limit_seconds) {
      if (formData.time_limit_seconds < 10 || formData.time_limit_seconds > 300) {
        newErrors.timeLimit = 'Time limit must be between 10 and 300 seconds';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback((field: keyof CreateGameData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (!isAuthenticated || !user) {
        throw new Error('You must be logged in to create a game');
      }

      const gameData = {
        ...formData,
        host_id: user.id,
      };

      const game = await gameService.createGame(gameData);
      onGameCreated(game);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create game',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onGameCreated]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Game</CardTitle>
        <CardDescription>
          Set up your trivia game with custom rules and configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Code Display */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm font-medium">Game Code</Label>
              <p className="text-2xl font-bold text-primary">{gameCode}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateNewCode}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Code
            </Button>
          </div>

          {/* Game Name */}
          <div className="space-y-2">
            <Label htmlFor="game-name">Game Name</Label>
            <Input
              id="game-name"
              type="text"
              placeholder="Enter game name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
            />
            {errors.name && (
              <Alert className="py-2">
                <AlertDescription className="text-destructive">
                  {errors.name}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Team Size Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-team-size">Minimum Team Size</Label>
              <Input
                id="min-team-size"
                type="number"
                min="1"
                max="6"
                value={formData.min_team_size}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 1 : parseInt(value, 10) || 1;
                  handleInputChange('min_team_size', numValue);
                }}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-team-size">Maximum Team Size</Label>
              <Input
                id="max-team-size"
                type="number"
                min="1"
                max="6"
                value={formData.max_team_size}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = value === '' ? 6 : parseInt(value, 10) || 6;
                  handleInputChange('max_team_size', numValue);
                }}
                disabled={isLoading}
              />
            </div>
          </div>

          {errors.teamSize && (
            <Alert className="py-2">
              <AlertDescription className="text-destructive">
                {errors.teamSize}
              </AlertDescription>
            </Alert>
          )}

          {/* Time Limit Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="time-limit">Enable Time Limit</Label>
                <p className="text-sm text-muted-foreground">
                  Set time limits for each question
                </p>
              </div>
              <Switch
                id="time-limit"
                checked={formData.time_limit_enabled}
                onCheckedChange={(checked) => handleInputChange('time_limit_enabled', checked)}
                disabled={isLoading}
              />
            </div>

            {formData.time_limit_enabled && (
              <div className="space-y-2">
                <Label htmlFor="time-seconds">Time Limit (seconds)</Label>
                <Input
                  id="time-seconds"
                  type="number"
                  min="10"
                  max="300"
                  value={formData.time_limit_seconds}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? 60 : parseInt(value, 10) || 60;
                    handleInputChange('time_limit_seconds', numValue);
                  }}
                  disabled={isLoading}
                />
                {errors.timeLimit && (
                  <Alert className="py-2">
                    <AlertDescription className="text-destructive">
                      {errors.timeLimit}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-effects">Enable Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Play sounds for game events
              </p>
            </div>
            <Switch
              id="sound-effects"
              checked={formData.sound_effects_enabled}
              onCheckedChange={(checked) => handleInputChange('sound_effects_enabled', checked)}
              disabled={isLoading}
            />
          </div>

          {/* Error Display */}
          {errors.submit && (
            <Alert className="py-3">
              <AlertDescription className="text-destructive">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Game...
              </>
            ) : (
              'Create Game'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
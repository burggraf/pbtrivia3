import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { roundService } from '@/services/game/roundService';
import { PREDEFINED_CATEGORIES } from '@/types/round';
import type { Round, CreateRoundData, UpdateRoundData } from '@/types/round';

interface RoundConfigurationFormProps {
  gameId: string;
  existingRound?: Round;
  onRoundCreated?: (round: Round) => void;
  onRoundUpdated?: (round: Round) => void;
  onRoundDeleted?: (roundId: string) => void;
}

export function RoundConfigurationForm({
  gameId,
  existingRound,
  onRoundCreated,
  onRoundUpdated,
  onRoundDeleted,
}: RoundConfigurationFormProps) {
  const [formData, setFormData] = useState<CreateRoundData>({
    game_id: gameId,
    title: '',
    num_questions: 10,
    categories: [],
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEditing = !!existingRound;

  useEffect(() => {
    if (existingRound) {
      setFormData({
        game_id: gameId,
        title: existingRound.title,
        num_questions: existingRound.num_questions,
        categories: existingRound.categories,
      });
      setSelectedCategories(existingRound.categories);
    }
  }, [existingRound, gameId]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Round title is required';
    }

    if (!formData.num_questions || formData.num_questions < 1 || formData.num_questions > 20) {
      newErrors.num_questions = 'Number of questions must be between 1 and 20';
    }

    if (selectedCategories.length === 0) {
      newErrors.categories = 'At least one category must be selected';
    }

    if (selectedCategories.length > 10) {
      newErrors.categories = 'Maximum 10 categories allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedCategories]);

  const handleInputChange = useCallback((field: keyof CreateRoundData, value: any) => {
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

  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category];

      // Update form data
      setFormData(prev => ({
        ...prev,
        categories: newCategories,
      }));

      // Clear category error
      if (errors.categories) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.categories;
          return newErrors;
        });
      }

      return newCategories;
    });
  }, [errors]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const roundData = {
        ...formData,
        categories: selectedCategories,
      };

      if (isEditing && existingRound) {
        const updatedRound = await roundService.updateRound(existingRound.id, roundData);
        onRoundUpdated?.(updatedRound);
      } else {
        const newRound = await roundService.createRound(roundData);
        onRoundCreated?.(newRound);

        // Reset form for new round creation
        setFormData({
          game_id: gameId,
          title: '',
          num_questions: 10,
          categories: [],
        });
        setSelectedCategories([]);
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save round',
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, selectedCategories, validateForm, isEditing, existingRound, gameId, onRoundCreated, onRoundUpdated]);

  const handleDelete = useCallback(async () => {
    if (!existingRound) return;

    try {
      await roundService.deleteRound(existingRound.id);
      onRoundDeleted?.(existingRound.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to delete round',
      });
    }
  }, [existingRound, onRoundDeleted]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Round' : 'Add Round'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Modify the round configuration'
            : 'Create a new round for your trivia game'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Round Title */}
          <div className="space-y-2">
            <Label htmlFor="round-title">Round Title</Label>
            <Input
              id="round-title"
              type="text"
              placeholder="Enter round title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={isLoading}
            />
            {errors.title && (
              <Alert className="py-2">
                <AlertDescription className="text-destructive">
                  {errors.title}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Number of Questions */}
          <div className="space-y-2">
            <Label htmlFor="num-questions">Number of Questions</Label>
            <Input
              id="num-questions"
              type="number"
              min="1"
              max="20"
              value={formData.num_questions}
              onChange={(e) => handleInputChange('num_questions', parseInt(e.target.value) || 10)}
              disabled={isLoading}
            />
            {errors.num_questions && (
              <Alert className="py-2">
                <AlertDescription className="text-destructive">
                  {errors.num_questions}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Categories Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Categories</Label>
              <Badge variant="secondary">
                {selectedCategories.length} {selectedCategories.length === 1 ? 'category' : 'categories'} selected
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PREDEFINED_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={category}
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    disabled={isLoading}
                    className="rounded"
                  />
                  <Label
                    htmlFor={category}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>

            {selectedCategories.length > 10 && (
              <Alert className="py-2">
                <AlertDescription className="text-destructive">
                  Maximum 10 categories allowed
                </AlertDescription>
              </Alert>
            )}

            {errors.categories && (
              <Alert className="py-2">
                <AlertDescription className="text-destructive">
                  {errors.categories}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Selected Categories Display */}
          {selectedCategories.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Categories</Label>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map((category) => (
                  <Badge key={category} variant="default">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.submit && (
            <Alert className="py-3">
              <AlertDescription className="text-destructive">
                {errors.submit}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating Round...' : 'Creating Round...'}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update Round
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Round
                    </>
                  )}
                </>
              )}
            </Button>

            {isEditing && (
              <>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>

                {showDeleteConfirm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md">
                      <h3 className="text-lg font-semibold mb-4">Delete Round</h3>
                      <p className="text-muted-foreground mb-6">
                        Are you sure you want to delete "{existingRound.title}"? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          onClick={handleDelete}
                          disabled={isLoading}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
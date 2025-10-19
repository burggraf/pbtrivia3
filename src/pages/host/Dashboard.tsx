import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GameSetupForm } from '@/components/host/GameSetupForm';
import { RoundConfigurationForm } from '@/components/host/RoundConfigurationForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trophy, Plus, Play, Settings, Users } from 'lucide-react';
import { gameService } from '@/services/game/gameService';
import { roundService } from '@/services/game/roundService';
import type { Game, Round } from '@/types';

interface HostDashboardProps {}

export function HostDashboard({}: HostDashboardProps) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | undefined>();
  const [error, setError] = useState<string | null>(null);

  const handleGameCreated = (game: Game) => {
    setCurrentGame(game);
    setError(null);
  };

  const handleRoundCreated = (round: Round) => {
    setRounds(prev => [...prev, round]);
    setError(null);
  };

  const handleRoundUpdated = (round: Round) => {
    setRounds(prev => prev.map(r => r.id === round.id ? round : r));
    setSelectedRound(undefined);
    setError(null);
  };

  const handleRoundDeleted = (roundId: string) => {
    setRounds(prev => prev.filter(r => r.id !== roundId));
    setSelectedRound(undefined);
    setError(null);
  };

  const handleStartGame = () => {
    if (!currentGame) return;
    // This would navigate to the game control page
    console.log('Starting game:', currentGame.id);
  };

  const canStartGame = currentGame && rounds.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Trivia Host Dashboard
          </h1>
          <p className="text-muted-foreground">
            Create and manage your trivia games
          </p>
        </div>
        {currentGame && (
          <Badge variant="secondary" className="text-sm">
            Game Code: {currentGame.code}
          </Badge>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="py-3">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {!currentGame ? (
        /* Game Creation View */
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">Create Your First Game</h2>
            <p className="text-muted-foreground">
              Set up game rules and configuration to get started
            </p>
          </div>
          <GameSetupForm onGameCreated={handleGameCreated} />
        </div>
      ) : (
        /* Game Setup View */
        <div className="space-y-6">
          {/* Game Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Game Configuration
              </CardTitle>
              <CardDescription>
                {currentGame.name} • Code: {currentGame.code}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Team Size:</span>
                  <p className="font-medium">{currentGame.min_team_size}-{currentGame.max_team_size}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Time Limit:</span>
                  <p className="font-medium">
                    {currentGame.time_limit_enabled ? `${currentGame.time_limit_seconds}s` : 'None'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sound Effects:</span>
                  <p className="font-medium">{currentGame.sound_effects_enabled ? 'On' : 'Off'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{currentGame.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rounds Configuration */}
          <Tabs defaultValue="rounds" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rounds" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Rounds ({rounds.length})
              </TabsTrigger>
              <TabsTrigger value="add-round" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Round
              </TabsTrigger>
              {selectedRound && (
                <TabsTrigger value="edit-round" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Edit Round
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="rounds" className="space-y-4">
              {rounds.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Rounds Yet</h3>
                      <p>Create your first round to start building your trivia game.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {rounds.map((round, index) => (
                    <Card key={round.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Round {index + 1}: {round.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {round.num_questions} questions • {round.categories.length} categories
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {round.categories.map((category) => (
                                <Badge key={category} variant="secondary" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRound(round)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {rounds.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleStartGame}
                      disabled={!canStartGame}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Game
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="add-round">
              <RoundConfigurationForm
                gameId={currentGame.id}
                onRoundCreated={handleRoundCreated}
              />
            </TabsContent>

            {selectedRound && (
              <TabsContent value="edit-round">
                <RoundConfigurationForm
                  gameId={currentGame.id}
                  existingRound={selectedRound}
                  onRoundUpdated={handleRoundUpdated}
                  onRoundDeleted={handleRoundDeleted}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}
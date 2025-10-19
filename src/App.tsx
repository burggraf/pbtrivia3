import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from '@/contexts/AuthContext'
import useGameStore from '@/stores/gameStore'
import { useAuth } from '@/contexts/AuthContext'
import { HostDashboard } from '@/pages/HostDashboard'
import { LoginPage } from '@/pages/LoginPage'
import { PlayerJoinPage } from '@/pages/PlayerJoinPage'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Users, Settings, LogOut } from 'lucide-react'

const HomePage = () => {
  const { user, logout, userRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">T</span>
              </div>
              <h1 className="text-xl font-bold">Trivia Party</h1>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Welcome, </span>
                  <span className="font-medium">{user.name}</span>
                  <Badge variant="outline" className="ml-2">
                    {userRole}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            Real-time Multiplayer Trivia for Venues
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create and host engaging trivia games that players can join from their devices.
            Perfect for bars, restaurants, and social events.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Host Games
              </CardTitle>
              <CardDescription>
                Create and manage trivia games with custom questions, timing, and scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/host')}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Join Games
              </CardTitle>
              <CardDescription>
                Join live trivia games using a game code provided by your host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate('/player/join')}>
                Join Game
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                TV Display
              </CardTitle>
              <CardDescription>
                Big screen display for showing questions and leaderboard during games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Demo Section */}
        <div className="bg-muted/50 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-4 text-center">Try Demo Mode</h3>
          <p className="text-center text-muted-foreground mb-6">
            Experience the platform without creating an account
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Try Host Demo
            </Button>
            <Button variant="outline" onClick={() => navigate('/player/join')}>
              Try Player Demo
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

const TVDisplayPage = () => <div className="text-center py-8">
  <h1 className="text-3xl font-bold mb-4">TV Display</h1>
  <p className="text-muted-foreground">Big screen trivia display - Coming Soon</p>
</div>

// App content wrapper
function AppContent() {
  const { user, isAuthenticated, userRole, setUserRole } = useAuth();
  const { setCurrentGame, setUser } = useGameStore((state: any) => ({
    setCurrentGame: state.setCurrentGame,
    setUser: state.setUser
  }));

  // Update game store when auth state changes
  React.useEffect(() => {
    setUser(user);
    if (!user) {
      setCurrentGame(null);
    }
  }, [user, setUser, setCurrentGame]);

  const handleRoleSelection = (role: 'host' | 'player') => {
    setUserRole(role);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // If user is authenticated but hasn't selected a role
  if (!userRole) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-3xl font-bold mb-8">Choose Your Role</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <button
                onClick={() => handleRoleSelection('host')}
                className="p-8 border-2 border-border rounded-lg hover:border-primary transition-colors"
              >
                <h2 className="text-2xl font-bold mb-4">🎮 Game Host</h2>
                <p className="text-muted-foreground">Create and manage trivia games</p>
              </button>
              <button
                onClick={() => handleRoleSelection('player')}
                className="p-8 border-2 border-border rounded-lg hover:border-primary transition-colors"
              >
                <h2 className="text-2xl font-bold mb-4">👥 Player</h2>
                <p className="text-muted-foreground">Join games and answer questions</p>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />

          {/* Host routes */}
          <Route
            path="/host/*"
            element={
              <ProtectedRoute requiredRole="host">
                <Routes>
                  <Route path="/" element={<HostDashboard />} />
                  <Route path="/dashboard" element={<HostDashboard />} />
                  <Route path="/game/:gameId" element={<HostDashboard />} />
                  <Route path="*" element={<Navigate to="/host" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Player routes */}
          <Route
            path="/player/*"
            element={
              <ProtectedRoute requiredRole="player">
                <Routes>
                  <Route path="/join" element={<PlayerJoinPage />} />
                  <Route path="/lobby/:gameCode" element={<PlayerJoinPage />} />
                  <Route path="/game/:gameCode" element={<PlayerJoinPage />} />
                  <Route path="*" element={<Navigate to="/player/join" replace />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* TV display routes (public but game-specific) */}
          <Route
            path="/tv/:gameCode"
            element={<TVDisplayPage />}
          />

          {/* Join game shortcut */}
          <Route
            path="/join/:gameCode"
            element={
              <ProtectedRoute requiredRole="player">
                <PlayerJoinPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback routes */}
          <Route
            path="/join"
            element={
              <ProtectedRoute requiredRole="player">
                <PlayerJoinPage />
              </ProtectedRoute>
            }
          />

          {/* Redirect based on role for default paths */}
          <Route
            path="/host"
            element={<Navigate to="/host/dashboard" replace />}
          />
          <Route
            path="/player"
            element={<Navigate to="/player/join" replace />}
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App
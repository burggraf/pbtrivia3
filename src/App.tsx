import React from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, ProtectedRoute } from '@/contexts/AuthContext'
import useGameStore from '@/stores/gameStore'
import { useAuth } from '@/contexts/AuthContext'
import { HostDashboard } from '@/pages/host/Dashboard'
import { LoginPage } from '@/pages/LoginPage'
import { PlayerJoinPage } from '@/pages/PlayerJoinPage'
import { Toaster } from '@/components/ui/toaster'


const TVDisplayPage = () => <div className="text-center py-8">
  <h1 className="text-3xl font-bold mb-4">TV Display</h1>
  <p className="text-muted-foreground">Big screen trivia display - Coming Soon</p>
</div>

// App content wrapper
function AppContent() {
  const navigate = useNavigate();
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
    // Navigate to appropriate dashboard based on role
    if (role === 'host') {
      navigate('/host/dashboard');
    } else {
      navigate('/player/join');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<LoginPage />} />
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
          <Route path="*" element={<Navigate to="/login" replace />} />
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
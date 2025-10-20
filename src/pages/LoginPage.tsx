import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect } from 'react'

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login, register, setUserRole, isAuthenticated, userRole } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<'host' | 'player'>('host')
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: ''
  })

  // Handle navigation after successful login and role setting
  useEffect(() => {
    if (isAuthenticated && userRole) {
      // Navigate to appropriate dashboard based on role
      if (userRole === 'host') {
        navigate('/host/dashboard')
      } else {
        navigate('/player/join')
      }
    }
  }, [isAuthenticated, userRole, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginData.email || !loginData.password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const user = await login(loginData.email, loginData.password)
      console.log('🔥 LOGIN SUCCESS - User object:', user)
      console.log('🔥 POCKETBASE AUTH STORE after login:', {
        isValid: (window as any).pb?.authStore?.isValid,
        token: !!(window as any).pb?.authStore?.token,
        record: (window as any).pb?.authStore?.record
      })

      toast({
        title: 'Login Successful',
        description: 'Please select your role to continue.',
      })

      // Navigate will be handled by AuthContext based on auth state only
      // Role selection happens on the role selection screen
    } catch (error) {
      console.error('❌ LOGIN FAILED:', error)
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Invalid credentials.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerData.email || !registerData.password || !registerData.name) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }

    if (registerData.password !== registerData.passwordConfirm) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await register({
        email: registerData.email,
        password: registerData.password,
        passwordConfirm: registerData.passwordConfirm,
        name: registerData.name
      })
      toast({
        title: 'Registration Successful',
        description: 'Account created successfully! Please select your role to continue.',
      })
      // Navigate will be handled by AuthContext based on auth state only
      // Role selection happens on the role selection screen
    } catch (error) {
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Registration failed.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Trivia Party</h1>
          <p className="text-muted-foreground">Real-time multiplayer trivia for venues</p>
        </div>

        {/* Role Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">Select Your Role</CardTitle>
            <CardDescription className="text-center">
              Choose how you want to participate in the trivia game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedRole === 'host' ? 'default' : 'outline'}
                onClick={() => setSelectedRole('host')}
                disabled={isLoading}
                className="h-16 flex flex-col items-center justify-center"
              >
                <div className="text-lg mb-1">🎮</div>
                <div>Game Host</div>
              </Button>
              <Button
                variant={selectedRole === 'player' ? 'default' : 'outline'}
                onClick={() => setSelectedRole('player')}
                disabled={isLoading}
                className="h-16 flex flex-col items-center justify-center"
              >
                <div className="text-lg mb-1">👥</div>
                <div>Player</div>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Currently selected: <span className="font-medium">{selectedRole === 'host' ? 'Game Host' : 'Player'}</span>
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : `Sign In as ${selectedRole === 'host' ? 'Host' : 'Player'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Join the trivia party community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Name</Label>
                    <Input
                      id="reg-name"
                      placeholder="Enter your name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password-confirm">Confirm Password</Label>
                    <Input
                      id="reg-password-confirm"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.passwordConfirm}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, passwordConfirm: e.target.value }))}
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : `Create Account as ${selectedRole === 'host' ? 'Host' : 'Player'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
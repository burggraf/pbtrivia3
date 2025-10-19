import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { login, register } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
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
      await login(loginData.email, loginData.password)
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      })
      navigate('/')
    } catch (error) {
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
        description: 'Account created successfully!',
      })
      navigate('/')
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

  // For demo purposes, create a quick login function
  const handleDemoLogin = async (role: 'host' | 'player') => {
    setIsLoading(true)
    try {
      // Simulate authentication for demo
      const demoUser = {
        id: role === 'host' ? 'demo_host_1' : 'demo_player_1',
        email: role === 'host' ? 'host@demo.com' : 'player@demo.com',
        name: role === 'host' ? 'Demo Host' : 'Demo Player',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Mock successful authentication
      localStorage.setItem('user', JSON.stringify(demoUser))
      localStorage.setItem('userRole', role)

      toast({
        title: 'Demo Login Successful',
        description: `Logged in as ${role === 'host' ? 'Game Host' : 'Player'}`,
      })

      // Force page reload to trigger auth context update
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Demo Login Failed',
        description: 'Could not complete demo login.',
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
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or try demo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin('host')}
                    disabled={isLoading}
                  >
                    🎮 Host Demo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDemoLogin('player')}
                    disabled={isLoading}
                  >
                    👥 Player Demo
                  </Button>
                </div>
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
                    {isLoading ? 'Creating Account...' : 'Create Account'}
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
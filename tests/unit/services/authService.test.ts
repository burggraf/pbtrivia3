import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userAuthService } from '@/services/auth/userAuthService'
import { pb } from '@/services/pocketbase/client'

// Mock PocketBase
vi.mock('@/services/pocketbase/client', () => ({
  pb: {
    collection: vi.fn(() => ({
      create: vi.fn(),
      authWithPassword: vi.fn(),
      authRefresh: vi.fn(),
      requestVerification: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmVerification: vi.fn(),
      confirmPasswordReset: vi.fn(),
    })),
    authStore: {
      isValid: false,
      model: null,
      clear: vi.fn(),
    },
  },
}))

describe('UserAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset auth store to default state
    pb.authStore.isValid = false
    pb.authStore.model = null
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
      }

      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.create).mockResolvedValue(mockUser)

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        name: 'Test User',
        username: 'testuser',
      }

      const result = await userAuthService.register(userData)

      expect(mockCollection.create).toHaveBeenCalledWith(userData)
      expect(result).toEqual(mockUser)
    })

    it('should throw error when registration fails', async () => {
      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.create).mockRejectedValue(new Error('Email already exists'))

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
        name: 'Test User',
        username: 'testuser',
      }

      await expect(userAuthService.register(userData)).rejects.toThrow('Email already exists')
    })

    it('should validate password confirmation matches', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        passwordConfirm: 'differentpassword',
        name: 'Test User',
        username: 'testuser',
      }

      await expect(userAuthService.register(userData)).rejects.toThrow('Passwords do not match')
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockAuthResponse = {
        token: 'auth-token-123',
        record: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      }

      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.authWithPassword).mockResolvedValue(mockAuthResponse)

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = await userAuthService.login(credentials.email, credentials.password)

      expect(mockCollection.authWithPassword).toHaveBeenCalledWith(credentials.email, credentials.password)
      expect(result).toEqual(mockAuthResponse.record)
      expect(pb.authStore.isValid).toBe(true)
    })

    it('should throw error when login fails', async () => {
      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.authWithPassword).mockRejectedValue(new Error('Invalid credentials'))

      await expect(userAuthService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials')
      expect(pb.authStore.isValid).toBe(false)
    })

    it('should validate email format', async () => {
      await expect(userAuthService.login('invalid-email', 'password123')).rejects.toThrow('Invalid email format')
    })
  })

  describe('logout', () => {
    it('should logout user and clear auth store', () => {
      // Set user as logged in
      pb.authStore.isValid = true
      pb.authStore.model = { id: 'user123', email: 'test@example.com' }

      userAuthService.logout()

      expect(pb.authStore.clear).toHaveBeenCalled()
      expect(pb.authStore.isValid).toBe(false)
      expect(pb.authStore.model).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when logged in', () => {
      const mockUser = { id: 'user123', email: 'test@example.com', name: 'Test User' }
      pb.authStore.isValid = true
      pb.authStore.model = mockUser

      const result = userAuthService.getCurrentUser()

      expect(result).toEqual(mockUser)
    })

    it('should return null when not logged in', () => {
      pb.authStore.isValid = false
      pb.authStore.model = null

      const result = userAuthService.getCurrentUser()

      expect(result).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when user is authenticated', () => {
      pb.authStore.isValid = true

      expect(userAuthService.isAuthenticated()).toBe(true)
    })

    it('should return false when user is not authenticated', () => {
      pb.authStore.isValid = false

      expect(userAuthService.isAuthenticated()).toBe(false)
    })
  })

  describe('refreshAuth', () => {
    it('should refresh authentication token', async () => {
      const mockRefreshResponse = {
        token: 'new-auth-token-123',
        record: {
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        },
      }

      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.authRefresh).mockResolvedValue(mockRefreshResponse)

      const result = await userAuthService.refreshAuth()

      expect(mockCollection.authRefresh).toHaveBeenCalled()
      expect(result).toEqual(mockRefreshResponse.record)
    })

    it('should handle refresh failure gracefully', async () => {
      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.authRefresh).mockRejectedValue(new Error('Token expired'))

      await expect(userAuthService.refreshAuth()).rejects.toThrow('Token expired')
    })
  })

  describe('requestPasswordReset', () => {
    it('should request password reset email', async () => {
      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.requestPasswordReset).mockResolvedValue(undefined)

      await userAuthService.requestPasswordReset('test@example.com')

      expect(mockCollection.requestPasswordReset).toHaveBeenCalledWith('test@example.com')
    })
  })

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        name: 'Updated Name',
        username: 'updateduser',
      }

      const mockCollection = pb.collection('users')
      vi.mocked(mockCollection.update).mockResolvedValue(mockUser)

      const updateData = {
        name: 'Updated Name',
        username: 'updateduser',
      }

      const result = await userAuthService.updateProfile('user123', updateData)

      expect(mockCollection.update).toHaveBeenCalledWith('user123', updateData)
      expect(result).toEqual(mockUser)
    })
  })
})
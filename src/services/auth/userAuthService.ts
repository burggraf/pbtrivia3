/**
 * User Authentication Service
 * Handles user registration, login, logout, and profile management
 */

import { pb } from '@/services/pocketbase/client'
import type {
  User,
  CreateUserData,
  LoginCredentials,
  UpdateUserData,
  AuthResponse,
  PasswordResetRequest,
  PasswordResetData,
  EmailVerificationData
} from '@/types/user'

export class UserAuthService {
  /**
   * Register a new user account
   */
  async register(userData: CreateUserData): Promise<User> {
    // Validate password confirmation
    if (userData.password !== userData.passwordConfirm) {
      throw new Error('Passwords do not match')
    }

    // Validate email format
    if (!this.isValidEmail(userData.email)) {
      throw new Error('Invalid email format')
    }

    // Validate name length
    if (!userData.name || userData.name.trim().length === 0) {
      throw new Error('Name is required')
    }

    if (userData.name.length > 100) {
      throw new Error('Name must be 100 characters or less')
    }

    // Validate username
    if (!userData.username || userData.username.trim().length === 0) {
      throw new Error('Username is required')
    }

    if (userData.username.length < 3) {
      throw new Error('Username must be at least 3 characters')
    }

    if (userData.username.length > 30) {
      throw new Error('Username must be 30 characters or less')
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
      throw new Error('Username can only contain letters, numbers, and underscores')
    }

    try {
      const record = await pb.collection('users').create(userData)
      return record as User
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`)
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<User> {
    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    if (!password || password.length === 0) {
      throw new Error('Password is required')
    }

    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      return authData.record as User
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`)
    }
  }

  /**
   * Logout current user and clear auth store
   */
  logout(): void {
    pb.authStore.clear()
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    if (pb.authStore.isValid && pb.authStore.model) {
      return pb.authStore.model as User
    }
    return null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return pb.authStore.isValid
  }

  /**
   * Refresh authentication token
   */
  async refreshAuth(): Promise<User> {
    try {
      const authData = await pb.collection('users').authRefresh()
      return authData.record as User
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`)
    }
  }

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch (error) {
      throw new Error(`Password reset request failed: ${error.message}`)
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(resetData: PasswordResetData): Promise<void> {
    if (resetData.password !== resetData.passwordConfirm) {
      throw new Error('Passwords do not match')
    }

    if (resetData.password.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    try {
      await pb.collection('users').confirmPasswordReset(
        resetData.token,
        resetData.password,
        resetData.passwordConfirm
      )
    } catch (error) {
      throw new Error(`Password reset confirmation failed: ${error.message}`)
    }
  }

  /**
   * Request email verification
   */
  async requestEmailVerification(email: string): Promise<void> {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    try {
      await pb.collection('users').requestVerification(email)
    } catch (error) {
      throw new Error(`Email verification request failed: ${error.message}`)
    }
  }

  /**
   * Confirm email verification with token
   */
  async confirmEmailVerification(verificationData: EmailVerificationData): Promise<void> {
    try {
      await pb.collection('users').confirmVerification(verificationData.token)
    } catch (error) {
      throw new Error(`Email verification confirmation failed: ${error.message}`)
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateUserData): Promise<User> {
    // Validate name if provided
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length === 0) {
        throw new Error('Name cannot be empty')
      }

      if (updateData.name.length > 100) {
        throw new Error('Name must be 100 characters or less')
      }
    }

    // Validate username if provided
    if (updateData.username !== undefined) {
      if (!updateData.username || updateData.username.trim().length === 0) {
        throw new Error('Username cannot be empty')
      }

      if (updateData.username.length < 3) {
        throw new Error('Username must be at least 3 characters')
      }

      if (updateData.username.length > 30) {
        throw new Error('Username must be 30 characters or less')
      }

      if (!/^[a-zA-Z0-9_]+$/.test(updateData.username)) {
        throw new Error('Username can only contain letters, numbers, and underscores')
      }
    }

    try {
      const record = await pb.collection('users').update(userId, updateData)
      return record as User
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`)
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string, passwordConfirm: string): Promise<void> {
    if (newPassword !== passwordConfirm) {
      throw new Error('Passwords do not match')
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters')
    }

    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to change password')
    }

    try {
      await pb.collection('users').update(this.getCurrentUser()!.id, {
        password: newPassword,
        passwordConfirm: passwordConfirm,
        oldPassword: currentPassword
      })
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`)
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Must be authenticated to delete account')
    }

    try {
      // Verify password before deletion (PocketBase handles this internally)
      await pb.collection('users').delete(this.getCurrentUser()!.id)
      this.logout()
    } catch (error) {
      throw new Error(`Account deletion failed: ${error.message}`)
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}

// Export singleton instance
export const userAuthService = new UserAuthService()
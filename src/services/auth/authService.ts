import { pb } from '../pocketbase/client';
import type { User, UserAuthInput, UserCreateInput } from '@/types';

export class AuthService {
  /**
   * Register a new user account
   */
  static async register(input: UserCreateInput): Promise<User> {
    try {
      const user = await pb.collection('users').create(input);

      // Auto-login after registration
      await pb.collection('users').authWithPassword(input.email, input.password);

      return user as unknown as User;
    } catch (error) {
      console.error('Registration error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Authenticate user with email and password
   */
  static async login(input: UserAuthInput): Promise<User> {
    try {
      const authData = await pb.collection('users').authWithPassword(
        input.email,
        input.password
      );

      return authData.record as unknown as User;
    } catch (error) {
      console.error('Login error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    try {
      pb.authStore.clear();
    } catch (error) {
      console.error('Logout error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  static getCurrentUser(): User | null {
    console.log('🔥 AuthService.getCurrentUser: PocketBase auth store:', {
      isValid: pb.authStore.isValid,
      token: !!pb.authStore.token,
      record: pb.authStore.record,
      model: pb.authStore.model
    });

    if (pb.authStore.isValid) {
      // Try record first, fallback to model
      const user = (pb.authStore.record || pb.authStore.model) as unknown as User;
      if (user) {
        console.log('🔥 AuthService.getCurrentUser: Returning user:', user);
        return user;
      }
    }

    console.log('🔥 AuthService.getCurrentUser: No valid user found');
    return null;
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return pb.authStore.isValid;
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    return (pb.authStore as any).token;
  }

  /**
   * Refresh authentication token (handled automatically by PocketBase)
   */
  static async refreshToken(): Promise<void> {
    // PocketBase handles token refresh automatically
    // This method exists for explicit refresh if needed
    if (pb.authStore.isValid && pb.authStore.token) {
      // Token is valid, no action needed
      return;
    }

    throw new Error('No valid authentication token to refresh');
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: Partial<Pick<User, 'name'>>): Promise<User> {
    try {
      if (!(pb.authStore as any).record) {
        throw new Error('No authenticated user');
      }

      const updatedUser = await pb.collection('users').update(
        (pb.authStore as any).record.id,
        data
      );

      return updatedUser as unknown as User;
    } catch (error) {
      console.error('Profile update error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Change password
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<void> {
    try {
      if (!(pb.authStore as any).record) {
        throw new Error('No authenticated user');
      }

      await pb.collection('users').update((pb.authStore as any).record.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: newPasswordConfirm,
      });
    } catch (error) {
      console.error('Password change error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<void> {
    try {
      await pb.collection('users').requestPasswordReset(email);
    } catch (error) {
      console.error('Password reset request error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Confirm password reset
   */
  static async confirmPasswordReset(
    token: string,
    password: string,
    passwordConfirm: string
  ): Promise<void> {
    try {
      await pb.collection('users').confirmPasswordReset(
        token,
        password,
        passwordConfirm
      );
    } catch (error) {
      console.error('Password reset confirmation error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Handle authentication state changes
   */
  static onAuthChange(callback: (user: User | null) => void): () => void {
    const unsubscribe = (pb.authStore as any).onChange(() => {
      callback(this.getCurrentUser());
    });

    // Call immediately with current state
    callback(this.getCurrentUser());

    return unsubscribe;
  }

  /**
   * Validate user input
   */
  static validateRegistrationInput(input: UserCreateInput): string[] {
    const errors: string[] = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!input.email) {
      errors.push('Email is required');
    } else if (!emailRegex.test(input.email)) {
      errors.push('Invalid email format');
    }

    // Password validation
    if (!input.password) {
      errors.push('Password is required');
    } else if (input.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    // Password confirmation
    if (input.password !== input.passwordConfirm) {
      errors.push('Passwords do not match');
    }

    // Name validation
    if (!input.name) {
      errors.push('Name is required');
    } else if (input.name.length < 1 || input.name.length > 50) {
      errors.push('Name must be between 1 and 50 characters');
    }

    return errors;
  }

  static validateLoginInput(input: UserAuthInput): string[] {
    const errors: string[] = [];

    if (!input.email) {
      errors.push('Email is required');
    }

    if (!input.password) {
      errors.push('Password is required');
    }

    return errors;
  }

  /**
   * Handle PocketBase errors and convert to user-friendly messages
   */
  private static handleError(error: any): Error {
    if (error?.data?.data) {
      // PocketBase validation errors
      const validationErrors = Object.entries(error.data.data)
        .map(([field, fieldError]) => {
          const errorMessage = Array.isArray(fieldError)
            ? fieldError.join(', ')
            : String(fieldError);
          return `${field}: ${errorMessage}`;
        });

      return new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    if (error?.data?.message) {
      // PocketBase application errors
      return new Error(error.data.message);
    }

    if (error?.message) {
      // Generic errors
      return new Error(error.message);
    }

    // Unknown error
    return new Error('An unexpected error occurred');
  }
}

// Export singleton instance for convenience
export default AuthService;
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService from '@/services/auth/authService';
import { pb } from '@/services/pocketbase/client';
import type { User, UserRole, UserCreateInput } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: UserCreateInput) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<Pick<User, 'name'>>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, newPasswordConfirm: string) => Promise<void>;
  setUserRole: (role: UserRole) => void;
  clearUserRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);

  // Computed values
  const isAuthenticated = Boolean(user);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check PocketBase auth store first
        console.log('🔥 AuthContext: Initializing auth, PocketBase auth store:', {
          isValid: pb.authStore.isValid,
          token: !!pb.authStore.token,
          record: pb.authStore.record,
          model: pb.authStore.model
        });

        if (pb.authStore.isValid && pb.authStore.record) {
          const currentUser = pb.authStore.record as User;
          setUser(currentUser);
          console.log('🔥 AuthContext: Found existing user in PocketBase store:', currentUser);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const unsubscribe = AuthService.onAuthChange((authUser) => {
      console.log('🔥 AuthContext: Auth state changed:', authUser);
      setUser(authUser);
      if (!authUser) {
        setUserRoleState(null); // Clear role when user logs out
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const loggedInUser = await AuthService.login({ email, password });
      console.log('🔥 AuthContext.login: User logged in:', loggedInUser);

      // Set user immediately from the login response
      setUser(loggedInUser);

      // Debug PocketBase auth store state
      console.log('🔥 AuthContext.login: PocketBase auth store state:', {
        isValid: pb.authStore.isValid,
        token: !!pb.authStore.token,
        record: pb.authStore.record,
        model: pb.authStore.model
      });

      // Force state sync if needed
      if (pb.authStore.isValid && pb.authStore.record && !user) {
        console.log('🔥 AuthContext.login: Direct PocketBase auth store sync');
        setUser(pb.authStore.record as User);
      }
    } catch (error) {
      console.error('❌ AuthContext.login: Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: UserCreateInput): Promise<void> => {
    setIsLoading(true);
    try {
      const registeredUser = await AuthService.register(input);
      setUser(registeredUser);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      setUserRoleState(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<Pick<User, 'name'>>): Promise<void> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      const updatedUser = await AuthService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<void> => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    setIsLoading(true);
    try {
      await AuthService.changePassword(currentPassword, newPassword, newPasswordConfirm);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const setUserRole = (role: UserRole): void => {
    setUserRoleState(role);
  };

  const clearUserRole = (): void => {
    setUserRoleState(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    userRole,
    login,
    register,
    logout,
    updateUserProfile,
    changePassword,
    setUserRole,
    clearUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return fallback || <div>Please log in to continue.</div>;
  }

  if (requiredRole && userRole !== requiredRole) {
    return fallback || <div>You don't have permission to access this page.</div>;
  }

  return <>{children}</>;
}

// Hook for role-based access control
export function useSingleRoleAccess(requiredRole: UserRole): boolean {
  const { isAuthenticated, userRole } = useAuth();

  return isAuthenticated && userRole === requiredRole;
}

// Hook for multiple role access
export function useRoleAccess(requiredRoles: UserRole[]): boolean {
  const { isAuthenticated, userRole } = useAuth();

  return isAuthenticated && userRole !== null && requiredRoles.includes(userRole);
}

export default AuthContext;
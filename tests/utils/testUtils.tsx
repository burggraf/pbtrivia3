import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../../src/contexts/AuthContext';
import type { User } from '../../src/types';

// Test user for auth context
const testUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  username: 'testuser',
  verified: true,
  created: '2025-01-19T00:00:00Z',
  updated: '2025-01-19T00:00:00Z',
};

// Custom render function with AuthProvider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Test utilities
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  ...testUser,
  ...overrides,
});

export const createMockAuthProvider = (user: User | null = null) => {
  return ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
};

// Mock PocketBase responses
export const createMockPocketBaseCollection = () => ({
  create: vi.fn(),
  getFirstListItem: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getFullList: vi.fn(),
  getOne: vi.fn(),
  getList: vi.fn(),
  subscribe: vi.fn(),
});

export const createMockPocketBase = () => ({
  collection: vi.fn(() => createMockPocketBaseCollection()),
  authStore: {
    isValid: true,
    token: 'mock-token',
    record: testUser,
    clear: vi.fn(),
    save: vi.fn(),
  },
});
/**
 * User types for the trivia party application
 * Represents user accounts and authentication data
 */

export interface User {
  id: string
  email: string
  name: string
  username: string
  avatar?: string
  verified: boolean
  created: string
  updated: string
}

export interface CreateUserData {
  email: string
  password: string
  passwordConfirm: string
  name: string
  username: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface UpdateUserData {
  name?: string
  username?: string
  avatar?: string
}

export interface AuthResponse {
  token: string
  record: User
}

export interface UserValidation {
  email: string
  password: string
  passwordConfirm?: string
  name: string
  username: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordResetData {
  token: string
  password: string
  passwordConfirm: string
}

export interface EmailVerificationData {
  token: string
}
import type { AppError } from '@/types'

// Error classes for different types of errors
export class TriviaAppError extends Error {
  public readonly code: string
  public readonly statusCode?: number
  public readonly details?: any

  constructor(message: string, code = 'UNKNOWN_ERROR', statusCode?: number, details?: any) {
    super(message)
    this.name = 'TriviaAppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TriviaAppError)
    }
  }
}

export class ValidationError extends TriviaAppError {
  public readonly field?: string
  public readonly value?: any

  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400, { field, value })
    this.name = 'ValidationError'
    this.field = field
    this.value = value
  }
}

export class AuthenticationError extends TriviaAppError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends TriviaAppError {
  constructor(message = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NetworkError extends TriviaAppError {
  constructor(message = 'Network request failed') {
    super(message, 'NETWORK_ERROR', 0)
    this.name = 'NetworkError'
  }
}

export class PocketBaseError extends TriviaAppError {
  constructor(message: string, originalError?: any) {
    super(message, 'POCKETBASE_ERROR', originalError?.status || 500, originalError)
    this.name = 'PocketBaseError'
  }
}

export class RealtimeError extends TriviaAppError {
  constructor(message = 'Real-time synchronization failed') {
    super(message, 'REALTIME_ERROR', 500)
    this.name = 'RealtimeError'
  }
}

// Error handling utilities
export class ErrorHandler {
  /**
   * Parse PocketBase errors and convert to appropriate error type
   */
  static parsePocketBaseError(error: any): TriviaAppError {
    if (!error) {
      return new TriviaAppError('Unknown error occurred')
    }

    // PocketBase validation errors
    if (error?.data?.data) {
      const validationErrors = Object.entries(error.data.data)
        .map(([field, fieldError]) => {
          const errorMessage = Array.isArray(fieldError)
            ? fieldError.join(', ')
            : String(fieldError)
          return `${field}: ${errorMessage}`
        })

      return new ValidationError(
        `Validation failed: ${validationErrors.join(', ')}`,
        Object.keys(error.data.data)[0],
        error.data.data[Object.keys(error.data.data)[0]]
      )
    }

    // PocketBase application errors
    if (error?.data?.message) {
      const message = error.data.message

      // Check for specific error types
      if (error.status === 401) {
        return new AuthenticationError(message)
      }
      if (error.status === 403) {
        return new AuthorizationError(message)
      }
      if (error.status === 404) {
        return new TriviaAppError(message, 'NOT_FOUND', 404)
      }

      return new PocketBaseError(message, error)
    }

    // Generic errors
    if (error?.message) {
      // Check for network-related errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return new NetworkError(error.message)
      }

      // Check for authentication errors
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return new AuthenticationError(error.message)
      }

      return new TriviaAppError(error.message, 'UNKNOWN_ERROR')
    }

    // Unknown error
    return new TriviaAppError('An unexpected error occurred', 'UNKNOWN_ERROR')
  }

  /**
   * Handle async errors in promises
   */
  static async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<{ data?: T; error?: TriviaAppError }> {
    try {
      const data = await asyncFn()
      return { data }
    } catch (error) {
      console.error(`Error in ${context || 'async operation'}:`, error)
      const parsedError = this.parsePocketBaseError(error)
      return { error: parsedError }
    }
  }

  /**
   * Create user-friendly error messages
   */
  static getUserFriendlyMessage(error: TriviaAppError): string {
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return error.message

      case 'AUTHENTICATION_ERROR':
        return 'Please log in to continue'

      case 'AUTHORIZATION_ERROR':
        return 'You don\'t have permission to perform this action'

      case 'NETWORK_ERROR':
        return 'Connection problem. Please check your internet connection and try again'

      case 'REALTIME_ERROR':
        return 'Connection to game lost. Trying to reconnect...'

      case 'POCKETBASE_ERROR':
        if (error.statusCode === 429) {
          return 'Too many requests. Please wait a moment and try again'
        }
        return 'Server error. Please try again later'

      case 'NOT_FOUND':
        return 'The requested resource was not found'

      default:
        return error.message || 'An unexpected error occurred'
    }
  }

  /**
   * Log errors with context
   */
  static log(error: TriviaAppError, context?: Record<string, any>): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    }

    if (error.statusCode && error.statusCode >= 500) {
      console.error('Server Error:', logData)
    } else if (error.statusCode && error.statusCode >= 400) {
      console.warn('Client Error:', logData)
    } else {
      console.info('Application Error:', logData)
    }
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: TriviaAppError): boolean {
    switch (error.code) {
      case 'NETWORK_ERROR':
      case 'REALTIME_ERROR':
        return true

      case 'POCKETBASE_ERROR':
        if (error.statusCode === 429 || error.statusCode === 502 || error.statusCode === 503) {
          return true
        }
        return false

      default:
        return false
    }
  }

  /**
   * Get retry delay for recoverable errors
   */
  static getRetryDelay(error: TriviaAppError, attempt: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds

    // Exponential backoff with jitter
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    const jitter = Math.random() * 0.1 * delay

    return Math.floor(delay + jitter)
  }
}

// Utility functions for common error scenarios
export const createErrorHandler = (context: string) => {
  return {
    handle: <T>(asyncFn: () => Promise<T>) => ErrorHandler.handleAsync(asyncFn, context),
    parse: (error: any) => ErrorHandler.parsePocketBaseError(error),
    log: (error: TriviaAppError, extraContext?: Record<string, any>) => ErrorHandler.log(error, { context, ...extraContext })
  }
}

// React error boundary utilities
export interface ErrorBoundaryState {
  hasError: boolean
  error?: TriviaAppError
  errorInfo?: any
}

export const createErrorBoundaryState = (): ErrorBoundaryState => ({
  hasError: false
})

export const handleComponentError = (error: Error, errorInfo: any): TriviaAppError => {
  const parsedError = ErrorHandler.parsePocketBaseError(error)
  ErrorHandler.log(parsedError, { errorInfo, component: 'ErrorBoundary' })
  return parsedError
}

// Toast notification utilities for error display
export interface ErrorToastOptions {
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export const getErrorToastProps = (error: TriviaAppError, options?: ErrorToastOptions) => {
  const message = ErrorHandler.getUserFriendlyMessage(error)
  const variant = error.statusCode && error.statusCode >= 500 ? 'destructive' : 'default'

  return {
    title: 'Error',
    description: message,
    variant,
    duration: options?.duration || ErrorHandler.isRecoverable(error) ? 5000 : 8000,
    action: options?.action
  }
}

// Export error types for use in components
export type {
  AppError
}
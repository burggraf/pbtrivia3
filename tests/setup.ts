import '@testing-library/jest-dom'
import { expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Extend Vitest's expect
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && document.body.contains(received)
    return {
      message: () =>
        `expected ${pass ? 'not ' : ''}to be in the document`,
      pass,
    }
  },
  toHaveValue(received, expected) {
    const pass = received.value === expected
    return {
      message: () =>
        `expected element to have value ${expected}, but got ${received.value}`,
      pass,
    }
  },
  toBeChecked(received) {
    // Handle both native checkboxes and Radix UI Switch components
    const pass = received.checked === true ||
                 received.getAttribute('aria-checked') === 'true' ||
                 received.getAttribute('data-state') === 'checked'
    return {
      message: () =>
        `expected element to be checked, but it was ${pass ? 'already ' : 'not '}checked`,
      pass,
    }
  }
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
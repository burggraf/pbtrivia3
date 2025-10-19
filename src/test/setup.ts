import '@testing-library/jest-dom'

// Mock PocketBase for testing
vi.mock('pocketbase', () => ({
  default: {
    collection: vi.fn(() => ({
      getFirstListItem: vi.fn(),
      getFullList: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      authWithPassword: vi.fn(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    authStore: {
      isValid: false,
      token: '',
      record: null,
      onChange: vi.fn(),
    },
  },
}))

// Mock Web Audio API
(global as any).AudioContext = vi.fn().mockImplementation(() => ({
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  })),
  decodeAudioData: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
}))

// Mock HTML5 Audio
(global as any).Audio = vi.fn().mockImplementation(() => ({
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
}))
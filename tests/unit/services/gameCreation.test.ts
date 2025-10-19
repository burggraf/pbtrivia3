import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gameService } from '../../../src/services/game/gameService';
import { pb } from '../../../src/services/pocketbase/client';

// Mock PocketBase
vi.mock('../../../src/services/pocketbase/client', () => ({
  pb: {
    collection: vi.fn(() => ({
      create: vi.fn(),
      getFirstListItem: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getFullList: vi.fn(),
    })),
  },
}));

describe('Game Creation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createGame', () => {
    it('should create a new game with valid data', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Trivia Night',
        code: 'ABC123',
        host_id: 'host-456',
        status: 'setup',
        min_team_size: 1,
        max_team_size: 6,
        time_limit_enabled: false,
        sound_effects_enabled: true,
      };

      const mockCollection = {
        create: vi.fn().mockResolvedValue(mockGame),
        getFirstListItem: vi.fn().mockResolvedValue(null), // No existing game with same code
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      const gameData = {
        name: 'Test Trivia Night',
        host_id: 'host-456',
        min_team_size: 1,
        max_team_size: 6,
        time_limit_enabled: false,
        sound_effects_enabled: true,
      };

      const result = await gameService.createGame(gameData);

      expect(mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Trivia Night',
          host_id: 'host-456',
          min_team_size: 1,
          max_team_size: 6,
          time_limit_enabled: false,
          sound_effects_enabled: true,
          status: 'setup',
        })
      );
      expect(result).toEqual(mockGame);
    });

    it('should generate a unique 6-character game code', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        code: 'XYZ789',
        host_id: 'host-456',
        status: 'setup',
      };

      const mockCollection = {
        create: vi.fn().mockResolvedValue(mockGame),
        getFirstListItem: vi.fn().mockResolvedValue(null),
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      const gameData = {
        name: 'Test Game',
        host_id: 'host-456',
      };

      const result = await gameService.createGame(gameData);

      expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(result.code).toBe('XYZ789');
    });

    it('should throw error for invalid game name', async () => {
      const gameData = {
        name: '', // Empty name should be invalid
        host_id: 'host-456',
      };

      await expect(gameService.createGame(gameData)).rejects.toThrow('Game name is required');
    });

    it('should throw error for invalid team size range', async () => {
      const gameData = {
        name: 'Test Game',
        host_id: 'host-456',
        min_team_size: 6,
        max_team_size: 1, // min > max should be invalid
      };

      await expect(gameService.createGame(gameData)).rejects.toThrow('Minimum team size cannot be greater than maximum');
    });

    it('should validate time limit range when enabled', async () => {
      const gameData = {
        name: 'Test Game',
        host_id: 'host-456',
        time_limit_enabled: true,
        time_limit_seconds: 5, // Too short, should be 10-300
      };

      await expect(gameService.createGame(gameData)).rejects.toThrow('Time limit must be between 10 and 300 seconds');
    });
  });

  describe('generateGameCode', () => {
    it('should generate a 6-character alphanumeric code', () => {
      const code = gameService.generateGameCode();

      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      expect(code.length).toBe(6);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = Array.from({ length: 10 }, () => gameService.generateGameCode());
      const uniqueCodes = new Set(codes);

      // With high probability, we should get different codes
      expect(uniqueCodes.size).toBeGreaterThan(1);
    });
  });

  describe('validateGameCode', () => {
    it('should return true for valid 6-character codes', () => {
      expect(gameService.validateGameCode('ABC123')).toBe(true);
      expect(gameService.validateGameCode('A1B2C3')).toBe(true);
      expect(gameService.validateGameCode('123456')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(gameService.validateGameCode('ABC12')).toBe(false); // Too short
      expect(gameService.validateGameCode('ABC1234')).toBe(false); // Too long
      expect(gameService.validateGameCode('abc123')).toBe(false); // Lowercase
      expect(gameService.validateGameCode('AB@123')).toBe(false); // Special character
      expect(gameService.validateGameCode('')).toBe(false); // Empty
    });
  });
});
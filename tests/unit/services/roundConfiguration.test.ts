import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roundService } from '../../../src/services/game/roundService';
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

describe('Round Configuration Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRound', () => {
    it('should create a new round with valid data', async () => {
      const mockRound = {
        id: 'round-123',
        game_id: 'game-456',
        round_number: 1,
        title: 'Round 1: General Knowledge',
        num_questions: 10,
        categories: ['General Knowledge', 'Science'],
        created_at: '2025-01-19T10:00:00Z',
      };

      const mockCollection = {
        create: vi.fn().mockResolvedValue(mockRound),
        getFullList: vi.fn().mockResolvedValue([]), // No existing rounds
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      const roundData = {
        game_id: 'game-456',
        title: 'Round 1: General Knowledge',
        num_questions: 10,
        categories: ['General Knowledge', 'Science'],
      };

      const result = await roundService.createRound(roundData);

      expect(mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          game_id: 'game-456',
          title: 'Round 1: General Knowledge',
          num_questions: 10,
          categories: ['General Knowledge', 'Science'],
          round_number: 1,
        })
      );
      expect(result).toEqual(mockRound);
    });

    it('should assign correct round number based on existing rounds', async () => {
      const existingRounds = [
        { round_number: 1 },
        { round_number: 2 },
      ];

      const mockNewRound = {
        id: 'round-123',
        game_id: 'game-456',
        round_number: 3,
        title: 'Round 3: Sports',
        num_questions: 8,
        categories: ['Sports'],
      };

      const mockCollection = {
        create: vi.fn().mockResolvedValue(mockNewRound),
        getFullList: vi.fn().mockResolvedValue(existingRounds),
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      const roundData = {
        game_id: 'game-456',
        title: 'Round 3: Sports',
        num_questions: 8,
        categories: ['Sports'],
      };

      const result = await roundService.createRound(roundData);

      expect(result.round_number).toBe(3);
    });

    it('should throw error for invalid round title', async () => {
      const roundData = {
        game_id: 'game-456',
        title: '', // Empty title should be invalid
        num_questions: 10,
        categories: ['General Knowledge'],
      };

      await expect(roundService.createRound(roundData)).rejects.toThrow('Round title is required');
    });

    it('should throw error for invalid number of questions', async () => {
      const roundData = {
        game_id: 'game-456',
        title: 'Test Round',
        num_questions: 25, // Too many questions, should be 1-20
        categories: ['General Knowledge'],
      };

      await expect(roundService.createRound(roundData)).rejects.toThrow('Number of questions must be between 1 and 20');
    });

    it('should throw error for no categories', async () => {
      const roundData = {
        game_id: 'game-456',
        title: 'Test Round',
        num_questions: 10,
        categories: [], // No categories should be invalid
      };

      await expect(roundService.createRound(roundData)).rejects.toThrow('At least one category must be selected');
    });

    it('should throw error for too many categories', async () => {
      const roundData = {
        game_id: 'game-456',
        title: 'Test Round',
        num_questions: 10,
        categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'], // 11 categories, should be max 10
      };

      await expect(roundService.createRound(roundData)).rejects.toThrow('Maximum 10 categories allowed');
    });
  });

  describe('updateRound', () => {
    it('should update an existing round', async () => {
      const mockUpdatedRound = {
        id: 'round-123',
        game_id: 'game-456',
        round_number: 1,
        title: 'Updated Round Title',
        num_questions: 12,
        categories: ['Science', 'Technology'],
      };

      const mockCollection = {
        update: vi.fn().mockResolvedValue(mockUpdatedRound),
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      const updateData = {
        title: 'Updated Round Title',
        num_questions: 12,
        categories: ['Science', 'Technology'],
      };

      const result = await roundService.updateRound('round-123', updateData);

      expect(mockCollection.update).toHaveBeenCalledWith('round-123', updateData);
      expect(result).toEqual(mockUpdatedRound);
    });
  });

  describe('deleteRound', () => {
    it('should delete a round', async () => {
      const mockCollection = {
        delete: vi.fn().mockResolvedValue(true),
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      await roundService.deleteRound('round-123');

      expect(mockCollection.delete).toHaveBeenCalledWith('round-123');
    });
  });

  describe('getRoundsByGame', () => {
    it('should return all rounds for a game ordered by round number', async () => {
      const mockRounds = [
        { id: 'round-1', round_number: 1, title: 'Round 1' },
        { id: 'round-2', round_number: 2, title: 'Round 2' },
        { id: 'round-3', round_number: 3, title: 'Round 3' },
      ];

      const mockCollection = {
        getFullList: vi.fn().mockResolvedValue(mockRounds),
      };

      (pb.collection as any).mockReturnValue(mockCollection);

      const result = await roundService.getRoundsByGame('game-456');

      expect(mockCollection.getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: 'game_id = "game-456"',
          sort: 'round_number',
        })
      );
      expect(result).toEqual([
        { id: 'round-1', round_number: 1, title: 'Round 1' },
        { id: 'round-2', round_number: 2, title: 'Round 2' },
        { id: 'round-3', round_number: 3, title: 'Round 3' },
      ]);
    });
  });

  describe('validateCategories', () => {
    it('should accept valid predefined categories', () => {
      const validCategories = [
        'Arts & Literature',
        'Entertainment',
        'Food and Drink',
        'General Knowledge',
        'Geography',
        'History',
        'Pop Culture',
        'Science',
        'Sports',
        'Technology',
      ];

      expect(roundService.validateCategories(validCategories)).toBe(true);
    });

    it('should reject invalid categories', () => {
      const invalidCategories = ['Invalid Category', 'Not Real'];

      expect(roundService.validateCategories(invalidCategories)).toBe(false);
    });

    it('should accept mixed valid and invalid categories', () => {
      const mixedCategories = ['General Knowledge', 'Invalid Category'];

      expect(roundService.validateCategories(mixedCategories)).toBe(false);
    });
  });
});
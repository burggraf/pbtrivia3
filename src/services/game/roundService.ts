import { pb } from '@/services/pocketbase/client'
import type { Round, CreateRoundData, UpdateRoundData } from '@/types/round'
import { PREDEFINED_CATEGORIES } from '@/types/round'

class RoundService {
  /**
   * Create a new round for a game
   */
  async createRound(data: CreateRoundData): Promise<Round> {
    try {
      // Validate round data
      this.validateCreateRoundData(data);

      // Get existing rounds to determine round number
      const existingRounds = await this.getRoundsByGame(data.game_id);
      const roundNumber = existingRounds.length + 1;

      // Create the round record
      const roundData = {
        game_id: data.game_id,
        round_number: roundNumber,
        title: data.title,
        num_questions: data.num_questions,
        categories: data.categories,
        status: 'setup',
        created_at: new Date().toISOString(),
      };

      const round = await pb.collection('rounds').create(roundData) as unknown as Round;
      return round;
    } catch (error) {
      console.error('Failed to create round:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create round');
    }
  }

  /**
   * Update an existing round
   */
  async updateRound(roundId: string, data: UpdateRoundData): Promise<Round> {
    try {
      const round = await pb.collection('rounds').update(roundId, data) as unknown as Round;
      return round;
    } catch (error) {
      console.error('Failed to update round:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update round');
    }
  }

  /**
   * Delete a round
   */
  async deleteRound(roundId: string): Promise<boolean> {
    try {
      await pb.collection('rounds').delete(roundId);
      return true;
    } catch (error) {
      console.error('Failed to delete round:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete round');
    }
  }

  /**
   * Get all rounds for a game, ordered by round number
   */
  async getRoundsByGame(gameId: string): Promise<Round[]> {
    try {
      const rounds = await pb.collection('rounds').getFullList({
        filter: `game_id = "${gameId}"`,
        sort: 'round_number',
      });

      return rounds as unknown as Round[];
    } catch (error) {
      console.error('Failed to get rounds for game:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get rounds for game');
    }
  }

  /**
   * Validate round creation data
   */
  private validateCreateRoundData(data: CreateRoundData): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Round title is required');
    }

    if (!data.num_questions || data.num_questions < 1 || data.num_questions > 20) {
      throw new Error('Number of questions must be between 1 and 20');
    }

    if (!data.categories || data.categories.length === 0) {
      throw new Error('At least one category must be selected');
    }

    if (data.categories.length > 10) {
      throw new Error('Maximum 10 categories allowed');
    }

    // Validate that all categories are from the predefined list
    const validCategories = this.validateCategories(data.categories);
    if (!validCategories) {
      throw new Error('Invalid categories selected');
    }
  }

  /**
   * Validate that all categories are from the predefined list
   */
  validateCategories(categories: string[]): boolean {
    return categories.every(category =>
      PREDEFINED_CATEGORIES.includes(category as typeof PREDEFINED_CATEGORIES[number])
    );
  }
}

// Create singleton instance
export const roundService = new RoundService();

export default roundService;
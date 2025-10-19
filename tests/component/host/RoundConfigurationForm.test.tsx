import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoundConfigurationForm } from '../../../src/components/host/RoundConfigurationForm';
import { roundService } from '../../../src/services/game/roundService';

// Mock the round service
vi.mock('../../../src/services/game/roundService', () => ({
  roundService: {
    createRound: vi.fn(),
    updateRound: vi.fn(),
    deleteRound: vi.fn(),
    getRoundsByGame: vi.fn(),
    validateCategories: vi.fn(),
  },
}));

// Mock the predefined categories
vi.mock('../../../src/utils/categories', () => ({
  PREDEFINED_CATEGORIES: [
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
  ],
}));

describe('RoundConfigurationForm', () => {
  const mockGameId = 'game-123';
  const mockOnRoundCreated = vi.fn();
  const mockOnRoundUpdated = vi.fn();
  const mockOnRoundDeleted = vi.fn();
  const user = userEvent.setup();

  const mockExistingRound = {
    id: 'round-123',
    title: 'Existing Round',
    num_questions: 10,
    categories: ['General Knowledge', 'Science'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (roundService.validateCategories as any).mockReturnValue(true);
    (roundService.getRoundsByGame as any).mockResolvedValue([mockExistingRound]);
  });

  describe('Form Rendering', () => {
    it('should render all form fields for new round', () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      expect(screen.getByLabelText(/round title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of questions/i)).toBeInTheDocument();
      expect(screen.getByText(/categories/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add round/i })).toBeInTheDocument();
    });

    it('should render with existing round data', () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          existingRound={mockExistingRound}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      expect(screen.getByDisplayValue('Existing Round')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update round/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete round/i })).toBeInTheDocument();
    });

    it('should display all predefined categories', () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      expect(screen.getByText('Arts & Literature')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
      expect(screen.getByText('General Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('Sports')).toBeInTheDocument();
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('should allow selecting multiple categories', async () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const generalKnowledgeCheckbox = screen.getByLabelText('General Knowledge');
      const scienceCheckbox = screen.getByLabelText('Science');

      await user.click(generalKnowledgeCheckbox);
      await user.click(scienceCheckbox);

      expect(generalKnowledgeCheckbox).toBeChecked();
      expect(scienceCheckbox).toBeChecked();
    });

    it('should show selected categories count', async () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const generalKnowledgeCheckbox = screen.getByLabelText('General Knowledge');

      expect(screen.getByText(/0 categories selected/i)).toBeInTheDocument();

      await user.click(generalKnowledgeCheckbox);

      expect(screen.getByText(/1 category selected/i)).toBeInTheDocument();
    });

    it('should limit selection to maximum 10 categories', async () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      // Select all 10 categories (maximum allowed)
      const categories = [
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

      for (const category of categories) {
        await user.click(screen.getByLabelText(category));
      }

      expect(screen.getByText(/10 categories selected/i)).toBeInTheDocument();
      expect(screen.getByText(/maximum 10 categories allowed/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty round title', async () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const submitButton = screen.getByRole('button', { name: /add round/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/round title is required/i)).toBeInTheDocument();
      });

      expect(mockOnRoundCreated).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid number of questions', async () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const titleInput = screen.getByLabelText(/round title/i);
      const questionsInput = screen.getByLabelText(/number of questions/i);
      const submitButton = screen.getByRole('button', { name: /add round/i });

      await user.type(titleInput, 'Test Round');
      await user.clear(questionsInput);
      await user.type(questionsInput, '25'); // Too many questions
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/number of questions must be between 1 and 20/i)).toBeInTheDocument();
      });

      expect(mockOnRoundCreated).not.toHaveBeenCalled();
    });

    it('should show validation error for no categories selected', async () => {
      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const titleInput = screen.getByLabelText(/round title/i);
      const submitButton = screen.getByRole('button', { name: /add round/i });

      await user.type(titleInput, 'Test Round');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/at least one category must be selected/i)).toBeInTheDocument();
      });

      expect(mockOnRoundCreated).not.toHaveBeenCalled();
    });
  });

  describe('Round Creation', () => {
    it('should create round with valid data', async () => {
      const mockNewRound = {
        id: 'round-456',
        game_id: mockGameId,
        round_number: 2,
        title: 'New Test Round',
        num_questions: 8,
        categories: ['General Knowledge', 'Science'],
      };

      (roundService.createRound as any).mockResolvedValue(mockNewRound);

      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const titleInput = screen.getByLabelText(/round title/i);
      const questionsInput = screen.getByLabelText(/number of questions/i);
      const generalKnowledgeCheckbox = screen.getByLabelText('General Knowledge');
      const submitButton = screen.getByRole('button', { name: /add round/i });

      await user.type(titleInput, 'New Test Round');
      await user.clear(questionsInput);
      await user.type(questionsInput, '8');
      await user.click(generalKnowledgeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(roundService.createRound).toHaveBeenCalledWith({
          game_id: mockGameId,
          title: 'New Test Round',
          num_questions: 8,
          categories: ['General Knowledge'],
        });
      });

      expect(mockOnRoundCreated).toHaveBeenCalledWith(mockNewRound);
    });

    it('should show loading state during creation', async () => {
      (roundService.createRound as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const titleInput = screen.getByLabelText(/round title/i);
      const generalKnowledgeCheckbox = screen.getByLabelText('General Knowledge');
      const submitButton = screen.getByRole('button', { name: /add round/i });

      await user.type(titleInput, 'Test Round');
      await user.click(generalKnowledgeCheckbox);
      await user.click(submitButton);

      expect(screen.getByText(/creating round/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/creating round/i)).not.toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 200 });
    });

    it('should handle round creation errors', async () => {
      const errorMessage = 'Failed to create round';
      (roundService.createRound as any).mockRejectedValue(new Error(errorMessage));

      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const titleInput = screen.getByLabelText(/round title/i);
      const generalKnowledgeCheckbox = screen.getByLabelText('General Knowledge');
      const submitButton = screen.getByRole('button', { name: /add round/i });

      await user.type(titleInput, 'Test Round');
      await user.click(generalKnowledgeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnRoundCreated).not.toHaveBeenCalled();
    });
  });

  describe('Round Editing', () => {
    it('should update existing round', async () => {
      const mockUpdatedRound = {
        ...mockExistingRound,
        title: 'Updated Round Title',
        num_questions: 12,
      };

      (roundService.updateRound as any).mockResolvedValue(mockUpdatedRound);

      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          existingRound={mockExistingRound}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const titleInput = screen.getByLabelText(/round title/i);
      const questionsInput = screen.getByLabelText(/number of questions/i);
      const updateButton = screen.getByRole('button', { name: /update round/i });

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Round Title');
      await user.clear(questionsInput);
      await user.type(questionsInput, '12');
      await user.click(updateButton);

      await waitFor(() => {
        expect(roundService.updateRound).toHaveBeenCalledWith('round-123', {
          title: 'Updated Round Title',
          num_questions: 12,
          categories: ['General Knowledge', 'Science'],
        });
      });

      expect(mockOnRoundUpdated).toHaveBeenCalledWith(mockUpdatedRound);
    });

    it('should delete existing round after confirmation', async () => {
      (roundService.deleteRound as any).mockResolvedValue(true);

      render(
        <RoundConfigurationForm
          gameId={mockGameId}
          existingRound={mockExistingRound}
          onRoundCreated={mockOnRoundCreated}
          onRoundUpdated={mockOnRoundUpdated}
          onRoundDeleted={mockOnRoundDeleted}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete round/i });

      await user.click(deleteButton);

      // Confirmation dialog
      const confirmButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(roundService.deleteRound).toHaveBeenCalledWith('round-123');
      });

      expect(mockOnRoundDeleted).toHaveBeenCalledWith('round-123');
    });
  });
});
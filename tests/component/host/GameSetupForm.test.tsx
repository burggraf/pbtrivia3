import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameSetupForm } from '../../../src/components/host/GameSetupForm';
import { gameService } from '../../../src/services/game/gameService';

// Mock the game service
vi.mock('../../../src/services/game/gameService', () => ({
  gameService: {
    createGame: vi.fn(),
    generateGameCode: vi.fn(),
    validateGameCode: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

describe('GameSetupForm', () => {
  const mockOnGameCreated = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (gameService.generateGameCode as any).mockReturnValue('ABC123');
    (gameService.validateGameCode as any).mockReturnValue(true);
  });

  describe('Form Rendering', () => {
    it('should render all form fields', () => {
      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      expect(screen.getByLabelText(/game name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/minimum team size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/maximum team size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enable time limit/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/enable sound effects/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create game/i })).toBeInTheDocument();
    });

    it('should display generated game code', () => {
      (gameService.generateGameCode as any).mockReturnValue('XYZ789');

      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      expect(screen.getByText(/game code: xyz789/i)).toBeInTheDocument();
    });

    it('should have sensible default values', () => {
      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      expect(screen.getByLabelText(/minimum team size/i)).toHaveValue(1);
      expect(screen.getByLabelText(/maximum team size/i)).toHaveValue(6);
      expect(screen.getByLabelText(/enable sound effects/i)).toBeChecked();
      expect(screen.getByLabelText(/enable time limit/i)).not.toBeChecked();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for empty game name', async () => {
      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const submitButton = screen.getByRole('button', { name: /create game/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/game name is required/i)).toBeInTheDocument();
      });

      expect(mockOnGameCreated).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid team size range', async () => {
      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const minTeamSizeInput = screen.getByLabelText(/minimum team size/i);
      const maxTeamSizeInput = screen.getByLabelText(/maximum team size/i);
      const submitButton = screen.getByRole('button', { name: /create game/i });

      await user.clear(minTeamSizeInput);
      await user.type(minTeamSizeInput, '6');
      await user.clear(maxTeamSizeInput);
      await user.type(maxTeamSizeInput, '2');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/minimum team size cannot be greater than maximum/i)).toBeInTheDocument();
      });

      expect(mockOnGameCreated).not.toHaveBeenCalled();
    });

    it('should show time limit input when time limit is enabled', async () => {
      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const timeLimitToggle = screen.getByLabelText(/enable time limit/i);

      expect(screen.queryByLabelText(/time limit \(seconds\)/i)).not.toBeInTheDocument();

      await user.click(timeLimitToggle);

      expect(screen.getByLabelText(/time limit \(seconds\)/i)).toBeInTheDocument();
    });

    it('should validate time limit range when enabled', async () => {
      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const timeLimitToggle = screen.getByLabelText(/enable time limit/i);
      const submitButton = screen.getByRole('button', { name: /create game/i });

      await user.click(timeLimitToggle);

      const timeLimitInput = screen.getByLabelText(/time limit \(seconds\)/i);
      await user.clear(timeLimitInput);
      await user.type(timeLimitInput, '5'); // Too short
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/time limit must be between 10 and 300 seconds/i)).toBeInTheDocument();
      });

      expect(mockOnGameCreated).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should create game with valid data', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Trivia Night',
        code: 'ABC123',
        status: 'setup',
        min_team_size: 2,
        max_team_size: 4,
        time_limit_enabled: true,
        time_limit_seconds: 60,
        sound_effects_enabled: true,
      };

      (gameService.createGame as any).mockResolvedValue(mockGame);

      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const nameInput = screen.getByLabelText(/game name/i);
      const minTeamSizeInput = screen.getByLabelText(/minimum team size/i);
      const maxTeamSizeInput = screen.getByLabelText(/maximum team size/i);
      const timeLimitToggle = screen.getByLabelText(/enable time limit/i);
      const submitButton = screen.getByRole('button', { name: /create game/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Test Trivia Night');
      await user.clear(minTeamSizeInput);
      await user.type(minTeamSizeInput, '2');
      await user.clear(maxTeamSizeInput);
      await user.type(maxTeamSizeInput, '4');
      await user.click(timeLimitToggle);

      const timeLimitInput = screen.getByLabelText(/time limit \(seconds\)/i);
      await user.clear(timeLimitInput);
      await user.type(timeLimitInput, '60');

      await user.click(submitButton);

      await waitFor(() => {
        expect(gameService.createGame).toHaveBeenCalledWith({
          name: 'Test Trivia Night',
          min_team_size: 2,
          max_team_size: 4,
          time_limit_enabled: true,
          time_limit_seconds: 60,
          sound_effects_enabled: true,
        });
      });

      expect(mockOnGameCreated).toHaveBeenCalledWith(mockGame);
    });

    it('should show loading state during submission', async () => {
      (gameService.createGame as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const nameInput = screen.getByLabelText(/game name/i);
      const submitButton = screen.getByRole('button', { name: /create game/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Test Game');
      await user.click(submitButton);

      expect(screen.getByText(/creating game/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText(/creating game/i)).not.toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 200 });
    });

    it('should handle game creation errors', async () => {
      const errorMessage = 'Failed to create game';
      (gameService.createGame as any).mockRejectedValue(new Error(errorMessage));

      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      const nameInput = screen.getByLabelText(/game name/i);
      const submitButton = screen.getByRole('button', { name: /create game/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Test Game');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnGameCreated).not.toHaveBeenCalled();
    });
  });

  describe('Game Code Generation', () => {
    it('should regenerate game code when refresh button is clicked', async () => {
      (gameService.generateGameCode as any)
        .mockReturnValueOnce('ABC123')
        .mockReturnValueOnce('XYZ789');

      render(<GameSetupForm onGameCreated={mockOnGameCreated} />);

      expect(screen.getByText(/game code: abc123/i)).toBeInTheDocument();

      const refreshButton = screen.getByRole('button', { name: /refresh code/i });
      await user.click(refreshButton);

      expect(screen.getByText(/game code: xyz789/i)).toBeInTheDocument();
    });
  });
});
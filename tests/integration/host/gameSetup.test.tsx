import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HostDashboard } from '../../../src/pages/host/Dashboard';
import { gameService } from '../../../src/services/game/gameService';
import { roundService } from '../../../src/services/game/roundService';
import { pb } from '../../../src/services/pocketbase/client';
import { AuthProvider } from '../../../src/contexts/AuthContext';

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
    authStore: {
      model: { id: 'host-123', name: 'Test Host' },
      isValid: true,
    },
  },
}));

// Mock services
vi.mock('../../../src/services/game/gameService', () => ({
  gameService: {
    createGame: vi.fn(),
    generateGameCode: vi.fn(),
    validateGameCode: vi.fn(),
    getGameByCode: vi.fn(),
  },
}));

vi.mock('../../../src/services/game/roundService', () => ({
  roundService: {
    createRound: vi.fn(),
    updateRound: vi.fn(),
    deleteRound: vi.fn(),
    getRoundsByGame: vi.fn(),
    validateCategories: vi.fn(),
  },
}));

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

// Test wrapper with providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Game Setup Integration Flow', () => {
  const user = userEvent.setup();
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default mock implementations
    (gameService.generateGameCode as any).mockReturnValue('ABC123');
    (gameService.validateGameCode as any).mockReturnValue(true);
    (roundService.validateCategories as any).mockReturnValue(true);
    (gameService.getGameByCode as any).mockResolvedValue(null);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('Complete Game Setup Flow', () => {
    it('should allow host to create game and configure rounds', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Friday Night Trivia',
        code: 'ABC123',
        host_id: 'host-123',
        status: 'setup',
        min_team_size: 2,
        max_team_size: 6,
        time_limit_enabled: true,
        time_limit_seconds: 60,
        sound_effects_enabled: true,
        created_at: '2025-01-19T10:00:00Z',
      };

      const mockRounds = [
        {
          id: 'round-1',
          game_id: 'game-123',
          round_number: 1,
          title: 'Round 1: General Knowledge',
          num_questions: 10,
          categories: ['General Knowledge', 'Science'],
        },
        {
          id: 'round-2',
          game_id: 'game-123',
          round_number: 2,
          title: 'Round 2: Entertainment',
          num_questions: 8,
          categories: ['Entertainment', 'Pop Culture'],
        },
      ];

      (gameService.createGame as any).mockResolvedValue(mockGame);
      (roundService.createRound as any).mockResolvedValue(mockRounds[0]);
      (roundService.getRoundsByGame as any).mockResolvedValue([]);

      render(
        <TestWrapper>
          <HostDashboard />
        </TestWrapper>
      );

      // Step 1: Create a new game
      const createGameButton = screen.getByRole('button', { name: /create new game/i });
      await user.click(createGameButton);

      // Step 2: Fill in game details
      const gameNameInput = screen.getByLabelText(/game name/i);
      const minTeamSizeInput = screen.getByLabelText(/minimum team size/i);
      const maxTeamSizeInput = screen.getByLabelText(/maximum team size/i);
      const timeLimitToggle = screen.getByLabelText(/enable time limit/i);

      await user.clear(gameNameInput);
      await user.type(gameNameInput, 'Friday Night Trivia');
      await user.clear(minTeamSizeInput);
      await user.type(minTeamSizeInput, '2');
      await user.clear(maxTeamSizeInput);
      await user.type(maxTeamSizeInput, '6');
      await user.click(timeLimitToggle);

      const timeLimitInput = screen.getByLabelText(/time limit \(seconds\)/i);
      await user.clear(timeLimitInput);
      await user.type(timeLimitInput, '60');

      // Step 3: Submit game creation
      const submitGameButton = screen.getByRole('button', { name: /create game/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(gameService.createGame).toHaveBeenCalledWith({
          name: 'Friday Night Trivia',
          min_team_size: 2,
          max_team_size: 6,
          time_limit_enabled: true,
          time_limit_seconds: 60,
          sound_effects_enabled: true,
        });
      });

      // Step 4: Verify game created and rounds setup appears
      await waitFor(() => {
        expect(screen.getByText(/game created successfully/i)).toBeInTheDocument();
        expect(screen.getByText('ABC123')).toBeInTheDocument();
        expect(screen.getByText(/configure rounds/i)).toBeInTheDocument();
      });

      // Step 5: Add first round
      const addRoundButton = screen.getByRole('button', { name: /add first round/i });
      await user.click(addRoundButton);

      const roundTitleInput = screen.getByLabelText(/round title/i);
      const questionsInput = screen.getByLabelText(/number of questions/i);
      const generalKnowledgeCheckbox = screen.getByLabelText('General Knowledge');

      await user.type(roundTitleInput, 'Round 1: General Knowledge');
      await user.clear(questionsInput);
      await user.type(questionsInput, '10');
      await user.click(generalKnowledgeCheckbox);

      const submitRoundButton = screen.getByRole('button', { name: /add round/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(roundService.createRound).toHaveBeenCalledWith({
          game_id: 'game-123',
          title: 'Round 1: General Knowledge',
          num_questions: 10,
          categories: ['General Knowledge'],
        });
      });

      // Step 6: Verify round appears in the list
      await waitFor(() => {
        expect(screen.getByText('Round 1: General Knowledge')).toBeInTheDocument();
        expect(screen.getByText('10 questions')).toBeInTheDocument();
      });

      // Step 7: Add second round
      (roundService.createRound as any).mockResolvedValue(mockRounds[1]);

      const addAnotherRoundButton = screen.getByRole('button', { name: /add another round/i });
      await user.click(addAnotherRoundButton);

      const roundTitleInput2 = screen.getByLabelText(/round title/i);
      const questionsInput2 = screen.getByLabelText(/number of questions/i);
      const entertainmentCheckbox = screen.getByLabelText('Entertainment');
      const popCultureCheckbox = screen.getByLabelText('Pop Culture');

      await user.type(roundTitleInput2, 'Round 2: Entertainment');
      await user.clear(questionsInput2);
      await user.type(questionsInput2, '8');
      await user.click(entertainmentCheckbox);
      await user.click(popCultureCheckbox);

      const submitRoundButton2 = screen.getByRole('button', { name: /add round/i });
      await user.click(submitRoundButton2);

      await waitFor(() => {
        expect(roundService.createRound).toHaveBeenCalledWith({
          game_id: 'game-123',
          title: 'Round 2: Entertainment',
          num_questions: 8,
          categories: ['Entertainment', 'Pop Culture'],
        });
      });

      // Step 8: Verify both rounds are displayed
      await waitFor(() => {
        expect(screen.getByText('Round 1: General Knowledge')).toBeInTheDocument();
        expect(screen.getByText('Round 2: Entertainment')).toBeInTheDocument();
        expect(screen.getByText(/2 rounds configured/i)).toBeInTheDocument();
      });

      // Step 9: Start the game
      const startGameButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startGameButton);

      await waitFor(() => {
        expect(screen.getByText(/game starting/i)).toBeInTheDocument();
      });
    });

    it('should handle validation errors throughout the setup flow', async () => {
      render(
        <TestWrapper>
          <HostDashboard />
        </TestWrapper>
      );

      // Try to create game with invalid data
      const createGameButton = screen.getByRole('button', { name: /create new game/i });
      await user.click(createGameButton);

      const submitGameButton = screen.getByRole('button', { name: /create game/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/game name is required/i)).toBeInTheDocument();
      });

      // Fix game name but leave invalid team sizes
      const gameNameInput = screen.getByLabelText(/game name/i);
      await user.type(gameNameInput, 'Test Game');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/minimum team size cannot be greater than maximum/i)).toBeInTheDocument();
      });

      // Fix team sizes and submit successfully
      const minTeamSizeInput = screen.getByLabelText(/minimum team size/i);
      const maxTeamSizeInput = screen.getByLabelText(/maximum team size/i);

      await user.clear(minTeamSizeInput);
      await user.type(minTeamSizeInput, '2');
      await user.clear(maxTeamSizeInput);
      await user.type(maxTeamSizeInput, '4');

      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        code: 'ABC123',
        status: 'setup',
      };

      (gameService.createGame as any).mockResolvedValue(mockGame);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/game created successfully/i)).toBeInTheDocument();
      });

      // Try to add round with invalid data
      const addRoundButton = screen.getByRole('button', { name: /add first round/i });
      await user.click(addRoundButton);

      const submitRoundButton = screen.getByRole('button', { name: /add round/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/round title is required/i)).toBeInTheDocument();
      });
    });

    it('should handle service errors gracefully', async () => {
      render(
        <TestWrapper>
          <HostDashboard />
        </TestWrapper>
      );

      const createGameButton = screen.getByRole('button', { name: /create new game/i });
      await user.click(createGameButton);

      const gameNameInput = screen.getByLabelText(/game name/i);
      await user.type(gameNameInput, 'Test Game');

      const submitGameButton = screen.getByRole('button', { name: /create game/i });

      // Mock service error
      const errorMessage = 'Failed to create game: Database error';
      (gameService.createGame as any).mockRejectedValue(new Error(errorMessage));

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create game/i })).not.toBeDisabled();
      });
    });
  });

  describe('Game Code Management', () => {
    it('should allow refreshing game code', async () => {
      render(
        <TestWrapper>
          <HostDashboard />
        </TestWrapper>
      );

      const createGameButton = screen.getByRole('button', { name: /create new game/i });
      await user.click(createGameButton);

      // Initial code
      expect(screen.getByText(/game code: abc123/i)).toBeInTheDocument();

      // Refresh code
      (gameService.generateGameCode as any).mockReturnValue('XYZ789');
      const refreshButton = screen.getByRole('button', { name: /refresh code/i });
      await user.click(refreshButton);

      expect(screen.getByText(/game code: xyz789/i)).toBeInTheDocument();
    });
  });

  describe('Round Management', () => {
    it('should allow editing and deleting rounds', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        code: 'ABC123',
        status: 'setup',
      };

      const mockExistingRound = {
        id: 'round-123',
        title: 'Existing Round',
        num_questions: 10,
        categories: ['General Knowledge'],
      };

      (gameService.createGame as any).mockResolvedValue(mockGame);
      (roundService.getRoundsByGame as any).mockResolvedValue([mockExistingRound]);

      render(
        <TestWrapper>
          <HostDashboard />
        </TestWrapper>
      );

      // Create game first
      const createGameButton = screen.getByRole('button', { name: /create new game/i });
      await user.click(createGameButton);

      const gameNameInput = screen.getByLabelText(/game name/i);
      await user.type(gameNameInput, 'Test Game');

      const submitGameButton = screen.getByRole('button', { name: /create game/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/game created successfully/i)).toBeInTheDocument();
      });

      // Edit existing round
      const editRoundButton = screen.getByRole('button', { name: /edit round/i });
      await user.click(editRoundButton);

      const roundTitleInput = screen.getByLabelText(/round title/i);
      await user.clear(roundTitleInput);
      await user.type(roundTitleInput, 'Updated Round Title');

      const updateButton = screen.getByRole('button', { name: /update round/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Round Title')).toBeInTheDocument();
      });

      // Delete round
      const deleteButton = screen.getByRole('button', { name: /delete round/i });
      await user.click(deleteButton);

      const confirmDeleteButton = screen.getByRole('button', { name: /confirm delete/i });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        expect(screen.getByText(/round deleted successfully/i)).toBeInTheDocument();
        expect(screen.queryByText('Updated Round Title')).not.toBeInTheDocument();
      });
    });
  });
});
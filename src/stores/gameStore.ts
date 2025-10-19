import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Game,
  Round,
  Team,
  TeamMember,
  Answer,
  GameState,
  Question,
  RoundQuestion,
  User,
  UserRole,
  TeamScore,
  AnswerProgress,
  SlideType,
  GameConfig
} from '@/types';

// Store interfaces
interface GameStoreState {
  // Current user and role
  user: User | null;
  userRole: UserRole | null;

  // Current game
  currentGame: Game | null;
  gameConfig: GameConfig | null;

  // Game state
  gameState: GameState | null;
  currentRound: Round | null;
  currentQuestion: RoundQuestion | null;
  currentQuestionData: Question | null;

  // Teams and members
  teams: Team[];
  teamMembers: TeamMember[];
  userTeam: Team | null;

  // Answers and scoring
  answers: Answer[];
  teamScores: TeamScore[];
  answerProgress: AnswerProgress;

  // UI state
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';

  // Sound settings
  soundEnabled: boolean;
  soundVolume: number;
}

interface GameStoreActions {
  // User and role management
  setUser: (user: User | null) => void;
  setUserRole: (role: UserRole | null) => void;

  // Game management
  setCurrentGame: (game: Game | null) => void;
  setGameConfig: (config: GameConfig | null) => void;

  // Game state management
  setGameState: (state: GameState | null) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  setCurrentRound: (round: Round | null) => void;
  setCurrentQuestion: (question: RoundQuestion | null) => void;
  setCurrentQuestionData: (questionData: Question | null) => void;

  // Teams management
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  removeTeam: (teamId: string) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  removeTeamMember: (memberId: string) => void;
  setUserTeam: (team: Team | null) => void;

  // Answers and scoring
  setAnswers: (answers: Answer[]) => void;
  addAnswer: (answer: Answer) => void;
  updateAnswer: (answerId: string, updates: Partial<Answer>) => void;
  setTeamScores: (scores: TeamScore[]) => void;
  updateTeamScore: (teamId: string, score: Partial<TeamScore>) => void;
  setAnswerProgress: (progress: AnswerProgress) => void;

  // Navigation helpers
  goToNextSlide: () => void;
  goToPreviousSlide: () => void;
  pauseGame: () => void;
  resumeGame: () => void;

  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;

  // Sound settings
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;

  // Reset
  resetGame: () => void;
  resetStore: () => void;
}

type GameStore = GameStoreState & GameStoreActions;

// Initial state
const initialState: GameStoreState = {
  user: null,
  userRole: null,
  currentGame: null,
  gameConfig: null,
  gameState: null,
  currentRound: null,
  currentQuestion: null,
  currentQuestionData: null,
  teams: [],
  teamMembers: [],
  userTeam: null,
  answers: [],
  teamScores: [],
  answerProgress: {
    total_teams: 0,
    answered_teams: 0,
    percentage: 0
  },
  isLoading: false,
  error: null,
  connectionStatus: 'connected',
  soundEnabled: true,
  soundVolume: 0.7
};

// Create the store
export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // User and role management
      setUser: (user) => set({ user }),
      setUserRole: (role) => set({ userRole: role }),

      // Game management
      setCurrentGame: (game) => set({ currentGame: game }),
      setGameConfig: (config) => set({ gameConfig: config }),

      // Game state management
      setGameState: (state) => set({ gameState: state }),
      updateGameState: (updates) => {
        const { gameState } = get();
        if (gameState) {
          set({ gameState: { ...gameState, ...updates, updated_at: new Date().toISOString() } });
        }
      },
      setCurrentRound: (round) => set({ currentRound: round }),
      setCurrentQuestion: (question) => set({ currentQuestion: question }),
      setCurrentQuestionData: (questionData) => set({ currentQuestionData: questionData }),

      // Teams management
      setTeams: (teams) => set({ teams }),
      addTeam: (team) => set((state) => ({ teams: [...state.teams, team] })),
      updateTeam: (teamId, updates) =>
        set((state) => ({
          teams: state.teams.map((team) =>
            team.id === teamId ? { ...team, ...updates } : team
          ),
        })),
      removeTeam: (teamId) =>
        set((state) => ({
          teams: state.teams.filter((team) => team.id !== teamId),
        })),
      setTeamMembers: (members) => set({ teamMembers: members }),
      addTeamMember: (member) =>
        set((state) => ({ teamMembers: [...state.teamMembers, member] })),
      removeTeamMember: (memberId) =>
        set((state) => ({
          teamMembers: state.teamMembers.filter((member) => member.id !== memberId),
        })),
      setUserTeam: (team) => set({ userTeam: team }),

      // Answers and scoring
      setAnswers: (answers) => set({ answers }),
      addAnswer: (answer) =>
        set((state) => {
          const newAnswers = [...state.answers, answer];
          const answeredTeams = new Set(newAnswers.map(a => a.team_id)).size;
          const totalTeams = state.teams.length;

          return {
            answers: newAnswers,
            answerProgress: {
              total_teams: totalTeams,
              answered_teams: answeredTeams,
              percentage: totalTeams > 0 ? (answeredTeams / totalTeams) * 100 : 0
            }
          };
        }),
      updateAnswer: (answerId, updates) =>
        set((state) => ({
          answers: state.answers.map((answer) =>
            answer.id === answerId ? { ...answer, ...updates } : answer
          ),
        })),
      setTeamScores: (scores) => set({ teamScores: scores }),
      updateTeamScore: (teamId, score) =>
        set((state) => ({
          teamScores: state.teamScores.map((teamScore) =>
            teamScore.team_id === teamId ? { ...teamScore, ...score } : teamScore
          ),
        })),
      setAnswerProgress: (progress) => set({ answerProgress: progress }),

      // Navigation helpers
      goToNextSlide: () => {
        const { gameState } = get();
        if (!gameState) return;

        const slideOrder: SlideType[] = [
          'game_intro',
          'round_intro',
          'question',
          'show_answer',
          'round_complete',
          'game_complete',
          'thanks'
        ];

        const currentIndex = slideOrder.indexOf(gameState.current_slide_type);
        if (currentIndex < slideOrder.length - 1) {
          get().updateGameState({
            current_slide_type: slideOrder[currentIndex + 1]
          });
        }
      },

      goToPreviousSlide: () => {
        const { gameState } = get();
        if (!gameState) return;

        const slideOrder: SlideType[] = [
          'game_intro',
          'round_intro',
          'question',
          'show_answer',
          'round_complete',
          'game_complete',
          'thanks'
        ];

        const currentIndex = slideOrder.indexOf(gameState.current_slide_type);
        if (currentIndex > 0) {
          get().updateGameState({
            current_slide_type: slideOrder[currentIndex - 1]
          });
        }
      },

      pauseGame: () => {
        get().updateGameState({ is_paused: true });
      },

      resumeGame: () => {
        get().updateGameState({ is_paused: false });
      },

      // UI state
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setConnectionStatus: (status) => set({ connectionStatus: status }),

      // Sound settings
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),

      // Reset
      resetGame: () =>
        set({
          currentGame: null,
          gameConfig: null,
          gameState: null,
          currentRound: null,
          currentQuestion: null,
          currentQuestionData: null,
          teams: [],
          teamMembers: [],
          userTeam: null,
          answers: [],
          teamScores: [],
          answerProgress: {
            total_teams: 0,
            answered_teams: 0,
            percentage: 0
          },
          error: null
        }),

      resetStore: () => set(initialState)
    }),
    {
      name: 'game-store',
      // Only persist certain fields to localStorage
      partialize: (state: any) => ({
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume
      })
    }
  )
);

// Selectors for common state combinations
export const useGameStoreSelector = {
  // Game selectors
  useCurrentGame: () => useGameStore((state) => state.currentGame),
  useGameState: () => useGameStore((state) => state.gameState),
  useGameConfig: () => useGameStore((state) => state.gameConfig),

  // User selectors
  useUser: () => useGameStore((state) => state.user),
  useUserRole: () => useGameStore((state) => state.userRole),
  useIsHost: () => useGameStore((state) => state.userRole === 'host'),
  useIsPlayer: () => useGameStore((state) => state.userRole === 'player'),

  // Team selectors
  useTeams: () => useGameStore((state) => state.teams),
  useUserTeam: () => useGameStore((state) => state.userTeam),
  useTeamMembers: () => useGameStore((state) => state.teamMembers),

  // Question selectors
  useCurrentQuestion: () => useGameStore((state) => ({
    roundQuestion: state.currentQuestion,
    questionData: state.currentQuestionData
  })),

  // Score selectors
  useTeamScores: () => useGameStore((state) => state.teamScores),
  useAnswerProgress: () => useGameStore((state) => state.answerProgress),

  // UI selectors
  useLoadingState: () => useGameStore((state) => state.isLoading),
  useErrorState: () => useGameStore((state) => state.error),
  useConnectionState: () => useGameStore((state) => state.connectionStatus),

  // Sound selectors
  useSoundSettings: () => useGameStore((state) => ({
    enabled: state.soundEnabled,
    volume: state.soundVolume
  }))
};

export default useGameStore;
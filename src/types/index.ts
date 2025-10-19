// Core entity types for the Multi-User Trivia Party Application

// ============================================================================
// 1. Users (Authentication)
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
}

export interface UserAuthInput {
  email: string;
  password: string;
}

// ============================================================================
// 2. Games (Host-Created Events)
// ============================================================================

export type GameStatus = 'setup' | 'live' | 'in_progress' | 'paused' | 'completed' | 'abandoned';

export interface Game {
  id: string;
  host_id: string;
  name: string;
  title: string; // Adding title field
  description?: string; // Adding description field
  code: string;
  game_code: string; // Adding game_code field
  status: GameStatus;
  min_team_size: number;
  max_team_size: number;
  max_teams?: number; // Adding max_teams field
  team_size?: number; // Adding team_size field
  round_count?: number; // Adding round_count field
  time_limit_enabled: boolean;
  time_limit_seconds: number;
  sound_effects_enabled: boolean;
  started_at?: string; // Adding started_at field
  completed_at?: string; // Adding completed_at field
  created_at: string;
  updated_at: string;
}

export interface GameCreateInput {
  name: string;
  min_team_size?: number;
  max_team_size?: number;
  time_limit_enabled?: boolean;
  time_limit_seconds?: number;
  sound_effects_enabled?: boolean;
}

export interface GameUpdateInput {
  name?: string;
  status?: GameStatus;
  min_team_size?: number;
  max_team_size?: number;
  time_limit_enabled?: boolean;
  time_limit_seconds?: number;
  sound_effects_enabled?: boolean;
}

// ============================================================================
// 3. Rounds (Game Structure)
// ============================================================================

export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  title: string;
  num_questions: number;
  categories: string[];
  created_at: string;
}

export interface RoundCreateInput {
  game_id: string;
  round_number: number;
  title: string;
  num_questions: number;
  categories: string[];
}

// ============================================================================
// 4. Questions (Static Database)
// ============================================================================

export type QuestionCategory =
  | 'Arts & Literature'
  | 'Entertainment'
  | 'Food and Drink'
  | 'General Knowledge'
  | 'Geography'
  | 'History'
  | 'Pop Culture'
  | 'Science'
  | 'Sports'
  | 'Technology';

export interface Question {
  id: string;
  category: QuestionCategory;
  question: string;
  a: string; // Correct answer
  b: string; // Incorrect answer 1
  c: string; // Incorrect answer 2
  d: string; // Incorrect answer 3
  metadata: QuestionMetadata;
  created_at: string;
  updated_at: string;
}

export interface QuestionMetadata {
  difficulty?: 'easy' | 'medium' | 'hard';
  source?: string;
  tags?: string[];
}

export interface QuestionFilters {
  category?: QuestionCategory;
  difficulty?: QuestionMetadata['difficulty'];
  limit?: number;
  offset?: number;
}

// ============================================================================
// 5. Round Questions (Selected Questions)
// ============================================================================

export interface RoundQuestion {
  id: string;
  round_id: string;
  question_id: string;
  question_number: number;
  shuffle_seed: number;
  created_at: string;
}

export interface RoundQuestionWithQuestion extends RoundQuestion {
  expand: {
    question_id: Question;
  };
}

// ============================================================================
// 6. Teams (Player Groups)
// ============================================================================

export interface Team {
  id: string;
  game_id: string;
  name: string;
  created_at: string;
}

export interface TeamWithMembers extends Team {
  expand: {
    team_members: TeamMember[];
  };
}

export interface TeamCreateInput {
  game_id: string;
  name: string;
}

// ============================================================================
// 7. Team Members (Player-Team Relationships)
// ============================================================================

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface TeamMemberWithUser extends TeamMember {
  expand: {
    user_id: Pick<User, 'id' | 'name'>;
  };
}

// ============================================================================
// 8. Answers (Team Submissions)
// ============================================================================

export type SelectedAnswer = 'a' | 'b' | 'c' | 'd';

export interface Answer {
  id: string;
  team_id: string;
  round_question_id: string;
  selected_answer: SelectedAnswer;
  is_correct: boolean;
  time_taken_ms: number;
  submitted_at: string;
}

export interface AnswerCreateInput {
  team_id: string;
  round_question_id: string;
  selected_answer: SelectedAnswer;
  time_taken_ms: number;
}

export interface AnswerWithDetails extends Answer {
  expand: {
    team_id: Team;
    round_question_id: RoundQuestionWithQuestion;
  };
}

// ============================================================================
// 9. Game State (Real-time Synchronization)
// ============================================================================

export type SlideType =
  | 'game_intro'
  | 'round_intro'
  | 'question'
  | 'show_answer'
  | 'round_complete'
  | 'game_complete'
  | 'thanks';

export interface GameState {
  id: string;
  game_id: string;
  current_slide_type: SlideType;
  current_round_id?: string;
  current_round_question_id?: string;
  is_paused: boolean;
  slide_data: Record<string, any>;
  started_at: string;
  updated_at: string;
}

export interface GameStateCreateInput {
  game_id: string;
  current_slide_type: SlideType;
  is_paused?: boolean;
  slide_data?: Record<string, any>;
}

export interface GameStateUpdateInput {
  current_slide_type?: SlideType;
  current_round_id?: string;
  current_round_question_id?: string;
  is_paused?: boolean;
  slide_data?: Record<string, any>;
}

// ============================================================================
// 10. Used Questions (Host History)
// ============================================================================

export interface UsedQuestion {
  id: string;
  host_id: string;
  question_id: string;
  used_at: string;
}

// ============================================================================
// UI and Application Types
// ============================================================================

export type UserRole = 'host' | 'player' | 'tv';

export interface AppState {
  user: User | null;
  currentGame: Game | null;
  userRole: UserRole | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}

export interface GameConfig {
  game: Game;
  rounds: Round[];
  selectedQuestions: RoundQuestionWithQuestion[];
}

// Game creation configuration interface
export interface GameCreationConfig {
  title: string;
  description?: string;
  host_id: string;
  status: 'setup' | 'in_progress' | 'paused' | 'completed';
  game_code: string;
  category_ids: string[];
  max_teams: number;
  team_size: number;
  round_count: number;
  questions_per_round: number;
  time_per_question: number;
  point_values: {
    correct: number;
    speed_bonus: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  enable_powerups: boolean;
  enable_sound_effects: boolean;
  show_leaderboard: boolean;
  allow_team_names: boolean;
  current_round: number;
  current_question: number;
  is_paused: boolean;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamScore {
  team_id: string;
  team_name: string;
  score: number;
  total_time: number;
  answers_count: number;
}

export interface AnswerProgress {
  total_teams: number;
  answered_teams: number;
  percentage: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  data: T;
  error?: {
    message: string;
    code?: number;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  perPage: number;
  totalPages: number;
  currentPage: number;
}

// ============================================================================
// Real-time Event Types
// ============================================================================

export interface RealtimeEvent<T = any> {
  action: 'create' | 'update' | 'delete';
  record: T;
}

export interface GameStateEvent extends RealtimeEvent<GameState> {}
export interface AnswerEvent extends RealtimeEvent<Answer> {}
export interface TeamEvent extends RealtimeEvent<Team> {}

// ============================================================================
// Error Types
// ============================================================================

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface ValidationError extends AppError {
  field?: string;
  value?: any;
}

// ============================================================================
// Sound Effect Types
// ============================================================================

export type SoundEffect =
  | 'game_start'
  | 'round_start'
  | 'question_appear'
  | 'answer_submit'
  | 'correct_answer'
  | 'wrong_answer'
  | 'timer_warning'
  | 'times_up'
  | 'round_complete'
  | 'game_complete'
  | 'button_click'
  | 'notification';

export interface SoundConfig {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}
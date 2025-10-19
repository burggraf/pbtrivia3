export interface Round {
  id: string;
  game_id: string;
  round_number: number;
  title: string;
  num_questions: number;
  categories: string[];
  created_at: string;
}

export interface CreateRoundData {
  game_id: string;
  title: string;
  num_questions: number;
  categories: string[];
}

export interface UpdateRoundData {
  title?: string;
  num_questions?: number;
  categories?: string[];
}

export interface RoundValidation {
  title: string;
  num_questions: number;
  categories: string[];
}

export interface RoundValidationError {
  field: keyof RoundValidation;
  message: string;
}

export const PREDEFINED_CATEGORIES = [
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
] as const;

export type Category = typeof PREDEFINED_CATEGORIES[number];
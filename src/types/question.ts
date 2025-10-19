export interface Question {
  id: string;
  category: string;
  question: string;
  a: string; // Correct answer
  b: string; // Incorrect answer 1
  c: string; // Incorrect answer 2
  d: string; // Incorrect answer 3
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    source?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface RoundQuestion {
  id: string;
  round_id: string;
  question_id: string;
  order: number;
  question?: Question; // Populated when needed
}

export interface QuestionValidation {
  category: string;
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
}

export interface QuestionValidationError {
  field: keyof QuestionValidation;
  message: string;
}
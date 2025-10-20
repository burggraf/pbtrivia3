export interface Game {
  id: string;
  host_id: string;
  name: string;
  code: string;
  status: 'setup' | 'live' | 'in_progress' | 'paused' | 'completed' | 'abandoned';
  min_team_size: number;
  max_team_size: number;
  time_limit_enabled: boolean;
  time_limit_seconds?: number;
  sound_effects_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGameData {
  name: string;
  host_id: string;
  min_team_size?: number;
  max_team_size?: number;
  time_limit_enabled?: boolean;
  time_limit_seconds?: number;
  sound_effects_enabled?: boolean;
}

export interface GameValidation {
  name: string;
  min_team_size: number;
  max_team_size: number;
  time_limit_enabled: boolean;
  time_limit_seconds?: number;
}

export interface GameValidationError {
  field: keyof GameValidation;
  message: string;
}
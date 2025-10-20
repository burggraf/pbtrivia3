/**
 * Team types for the trivia party application
 * Represents teams that players can join and compete with
 */

export interface Team {
  id: string
  game_id: string
  name: string
  team_number: number
  score: number
  status: TeamStatus
  created_at: string
}

export type TeamStatus = 'forming' | 'ready' | 'playing'

export interface CreateTeamData {
  game_id: string
  name: string
  team_number: number
}

export interface UpdateTeamData {
  name?: string
  score?: number
  status?: TeamStatus
}

export interface TeamValidation {
  name: string
  team_number: number
  game_id: string
}

export interface TeamSummary {
  id: string
  name: string
  team_number: number
  score: number
  status: TeamStatus
  member_count: number
  is_full: boolean
}

export interface TeamWithMembers extends Team {
  members: TeamMember[]
}

export interface TeamJoinabilityResult {
  canJoin: boolean
  reason: string
  maxTeamSize?: number
  currentTeamCount?: number
}

export interface TeamListOptions {
  game_id: string
  include_members?: boolean
  include_member_count?: boolean
  status?: TeamStatus[]
  sort_by?: 'team_number' | 'name' | 'score' | 'created_at'
  sort_order?: 'asc' | 'desc'
}
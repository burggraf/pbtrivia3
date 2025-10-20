/**
 * Team Member types for the trivia party application
 * Represents players who are members of teams
 */

import type { User, Team } from './index'

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  name: string
  is_captain: boolean
  joined_at: string
}

export interface CreateTeamMemberData {
  team_id: string
  user_id: string
  name: string
  is_captain?: boolean
  joined_at?: string
}

export interface UpdateTeamMemberData {
  name?: string
  is_captain?: boolean
}

export interface TeamMemberValidation {
  team_id: string
  user_id: string
  name: string
  is_captain: boolean
}

export interface TeamMemberWithRelations extends TeamMember {
  user?: User
  team?: Team
}

export interface TeamJoinRequest {
  user_id: string
  team_id: string
  name: string
  is_captain?: boolean
}

export interface TeamLeaveRequest {
  user_id: string
  team_id: string
  transfer_captain_to?: string
}

export interface TeamCaptainTransfer {
  current_captain_id: string
  new_captain_id: string
  team_id: string
}

export interface TeamMemberSummary {
  id: string
  name: string
  is_captain: boolean
  joined_at: string
  user_id?: string
}

export interface TeamMembershipInfo {
  is_member: boolean
  is_captain: boolean
  team_id?: string
  team_name?: string
  joined_at?: string
  member_count: number
}
/**
 * Match-related TypeScript types for participant dashboard
 */

export interface TimeBlock {
  id: number;
  startTime: string; // ISO 8601 datetime string
}

export interface VolunteerSummary {
  id: string; // UUID
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  pronouns: string[] | null;
  diagnosis: string | null;
  age: number | null;
  timezone: string | null; // Volunteer's timezone (optional, being added in another branch)
  treatments: string[];
  experiences: string[];
  overview: string | null; // Volunteer experience/overview from volunteer_data
  lovedOneDiagnosis?: string | null;
  lovedOneTreatments?: string[];
  lovedOneExperiences?: string[];
}

export interface Match {
  id: number;
  participantId: string; // UUID
  volunteer: VolunteerSummary;
  matchStatus: MatchStatus;
  chosenTimeBlock: TimeBlock | null;
  suggestedTimeBlocks: TimeBlock[];
  createdAt: string; // ISO 8601 datetime string
  updatedAt: string | null; // ISO 8601 datetime string
}

export type MatchStatus =
  | 'pending'
  | 'confirmed'
  | 'requesting_new_times'
  | 'cancelled_by_participant'
  | 'cancelled_by_volunteer'
  | 'requesting_new_volunteers'
  | 'completed'
  | 'awaiting_volunteer_acceptance';

export interface MatchListResponse {
  matches: Match[];
  hasPendingRequest: boolean;
}

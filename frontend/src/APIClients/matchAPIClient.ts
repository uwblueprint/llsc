/**
 * API Client for match endpoints
 */

import baseAPIClient from './baseAPIClient';

export interface MatchCreateRequest {
  participantId: string;
  volunteerIds: string[];
  matchStatus?: string;
}

export interface MatchResponse {
  id: number;
  participantId: string;
  volunteerId: string;
  matchStatus: string;
  chosenTimeBlockId?: number | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface MatchCreateResponse {
  matches: MatchResponse[];
}

export interface MatchVolunteerSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  pronouns: string[] | null;
  diagnosis: string | null;
  age: number | null;
  timezone: string | null;
  treatments: string[];
  experiences: string[];
  overview: string | null;
  lovedOneDiagnosis?: string | null;
  lovedOneTreatments?: string[];
  lovedOneExperiences?: string[];
}

export interface TimeBlockEntity {
  id: number;
  startTime: string;
}

export interface MatchDetailResponse {
  id: number;
  participantId: string;
  volunteer: MatchVolunteerSummary;
  matchStatus: string;
  chosenTimeBlock?: TimeBlockEntity | null;
  suggestedTimeBlocks: TimeBlockEntity[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface MatchListResponse {
  matches: MatchDetailResponse[];
  hasPendingRequest: boolean;
}

export interface MatchParticipantSummary {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  pronouns: string[] | null;
  diagnosis: string | null;
  age: number | null;
  treatments: string[];
  experiences: string[];
  timezone: string | null;
  lovedOneDiagnosis?: string | null;
  lovedOneTreatments?: string[];
  lovedOneExperiences?: string[];
}

export interface MatchDetailForVolunteerResponse {
  id: number;
  participantId: string;
  volunteerId: string;
  participant: MatchParticipantSummary;
  matchStatus: string;
  createdAt: string;
  updatedAt?: string | null;
  chosenTimeBlock?: TimeBlockEntity | null;
  suggestedTimeBlocks?: TimeBlockEntity[];
}

export interface MatchListForVolunteerResponse {
  matches: MatchDetailForVolunteerResponse[];
}

export const matchAPIClient = {
  /**
   * Create matches between a participant and volunteers
   * @param request Match creation request
   * @returns Created matches
   */
  createMatches: async (request: MatchCreateRequest): Promise<MatchCreateResponse> => {
    const response = await baseAPIClient.post<MatchCreateResponse>('/matches/', request);
    return response.data;
  },

  /**
   * Get existing matches for a participant (admin only)
   * @param participantId Participant user ID
   * @returns List of participant's existing matches
   */
  getMatchesForParticipant: async (participantId: string): Promise<MatchListResponse> => {
    const response = await baseAPIClient.get<MatchListResponse>(
      `/matches/participant/${participantId}`,
    );
    return response.data;
  },

  /**
   * Get existing matches for a volunteer (admin only)
   * @param volunteerId Volunteer user ID
   * @returns List of volunteer's existing matches
   */
  getMatchesForVolunteer: async (volunteerId: string): Promise<MatchListForVolunteerResponse> => {
    const response = await baseAPIClient.get<MatchListForVolunteerResponse>(
      `/matches/volunteer/${volunteerId}`,
    );
    return response.data;
  },
};

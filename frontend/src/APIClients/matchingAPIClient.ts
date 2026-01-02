/**
 * API Client for matching endpoints
 */

import baseAPIClient from './baseAPIClient';

export interface AdminMatchCandidate {
  volunteerId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  timezone: string | null;
  age: number | null;
  diagnosis: string | null;
  dateOfDiagnosis?: string | null;
  treatments: string[];
  experiences: string[];
  matchScore: number;
  matchCount: number;
  // Additional fields for dynamic columns
  maritalStatus?: string | null;
  genderIdentity?: string | null;
  ethnicGroup?: string[] | null;
  hasKids?: string | null;
  lovedOneAge?: string | null;
  lovedOneDiagnosis?: string | null;
  lovedOneDateOfDiagnosis?: string | null;
  lovedOneTreatments?: string[];
  lovedOneExperiences?: string[];
}

export interface AdminMatchesResponse {
  matches: AdminMatchCandidate[];
}

export const matchingAPIClient = {
  /**
   * Get potential volunteer matches for a participant (admin only)
   * @param participantId Participant user ID
   * @returns List of volunteer matches with full details and scores
   */
  getAdminMatches: async (participantId: string): Promise<AdminMatchesResponse> => {
    const response = await baseAPIClient.get<AdminMatchesResponse>(
      `/matching/admin/${participantId}`,
    );
    return response.data;
  },
};

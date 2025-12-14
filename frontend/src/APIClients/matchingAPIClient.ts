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
  treatments: string[];
  experiences: string[];
  matchScore: number;
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

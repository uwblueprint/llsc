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
};

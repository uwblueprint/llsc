/**
 * API Client for participant match management
 *
 * All endpoints are authenticated and use the baseAPIClient which:
 * - Auto-injects Firebase auth tokens
 * - Converts request/response between camelCase ↔ snake_case
 */

import baseAPIClient from './baseAPIClient';
import { MatchListResponse } from '../types/matchTypes';

export const participantMatchAPIClient = {
  /**
   * Get all matches for the current participant
   * @returns List of matches with volunteer details and time blocks
   */
  getMyMatches: async (): Promise<MatchListResponse> => {
    const response = await baseAPIClient.get('/matches/me');
    return response.data;
  },

  /**
   * Request new volunteers for the current participant
   * @param message Optional message to include with the request
   * @returns Number of deleted matches
   */
  requestNewVolunteers: async (message?: string): Promise<{ deletedMatches: number }> => {
    const response = await baseAPIClient.post('/matches/request-new-volunteers', {
      message: message || null,
    });
    return response.data;
  },
};

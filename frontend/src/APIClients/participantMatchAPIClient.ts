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

  /**
   * Schedule a match by selecting a time block
   * @param matchId The match ID
   * @param timeBlockId The selected time block ID
   * @returns Updated match details
   */
  scheduleMatch: async (matchId: number, timeBlockId: number): Promise<void> => {
    const response = await baseAPIClient.post(`/matches/${matchId}/schedule`, {
      timeBlockId,
    });
    return response.data;
  },

  /**
   * Cancel a match as a participant
   * @param matchId The match ID
   * @returns Updated match details
   */
  cancelMatch: async (matchId: number): Promise<void> => {
    const response = await baseAPIClient.post(`/matches/${matchId}/cancel`);
    return response.data;
  },

  /**
   * Request new times for a match
   * @param matchId The match ID
   * @param timeRanges Array of time ranges (start_time and end_time)
   * @returns Updated match details
   */
  requestNewTimes: async (
    matchId: number,
    timeRanges: Array<{ startTime: string; endTime: string }>,
  ): Promise<void> => {
    const response = await baseAPIClient.post(`/matches/${matchId}/request-new-times`, {
      suggestedNewTimes: timeRanges.map((range) => ({
        start_time: range.startTime,
        end_time: range.endTime,
      })),
    });
    return response.data;
  },
};

/**
 * API Client for ranking endpoints
 */

import baseAPIClient from './baseAPIClient';

export interface RankingPreference {
  kind: 'quality' | 'treatment' | 'experience';
  id: number;
  scope: 'self' | 'loved_one';
  rank: number;
  name: string;
}

export const rankingAPIClient = {
  /**
   * Get ranking preferences for a user (admin only)
   * @param userId User ID
   * @param target Target role ('patient' or 'caregiver')
   * @returns List of ranking preferences
   */
  getPreferences: async (userId: string, target: 'patient' | 'caregiver'): Promise<RankingPreference[]> => {
    const response = await baseAPIClient.get<RankingPreference[]>(`/ranking/preferences/${userId}`, {
      params: { target },
    });
    return response.data;
  },
};


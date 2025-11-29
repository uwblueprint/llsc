import baseAPIClient from './baseAPIClient';

export interface VolunteerDataResponse {
  id: string;
  userId: string | null;
  experience: string | null;
  referencesJson: string | null;
  additionalComments: string | null;
  submittedAt: string;
}

class VolunteerDataAPIClient {
  /**
   * Get VolunteerData for a specific user
   */
  async getVolunteerDataByUserId(userId: string): Promise<VolunteerDataResponse | null> {
    try {
      const response = await baseAPIClient.get<VolunteerDataResponse>(
        `/volunteer-data/user/${userId}`,
      );
      return response.data;
    } catch {
      // Return null if volunteer data doesn't exist
      return null;
    }
  }
}

export const volunteerDataAPIClient = new VolunteerDataAPIClient();

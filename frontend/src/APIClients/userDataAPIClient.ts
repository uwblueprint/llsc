import baseAPIClient from './baseAPIClient';
import { getCurrentUserId, getAuthHeaders } from '../utils/AuthUtils';

export interface AvailabilityTemplateResponse {
  dayOfWeek: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  startTime: string; // Time string in format "HH:MM:SS"
  endTime: string; // Time string in format "HH:MM:SS"
}

export interface UserDataResponse {
  // Personal Information (camelCase after axios interceptor conversion)
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  // Demographics
  genderIdentity?: string;
  pronouns?: string[];
  ethnicGroup?: string[];
  maritalStatus?: string;
  hasKids?: string;
  otherEthnicGroup?: string;
  genderIdentityCustom?: string;

  // Cancer Experience
  diagnosis?: string;
  dateOfDiagnosis?: string;
  treatments?: string[];
  experiences?: string[];

  // Loved One Information
  lovedOneGenderIdentity?: string;
  lovedOneAge?: string;
  lovedOneDiagnosis?: string;
  lovedOneDateOfDiagnosis?: string;
  lovedOneTreatments?: string[];
  lovedOneExperiences?: string[];

  // Flow Control
  hasBloodCancer?: boolean;
  caringForSomeone?: boolean;

  // Availability
  availability?: AvailabilityTemplateResponse[];
}

export interface FormSubmissionResponse {
  id: string;
  form_id: string;
  user_id: string;
  submitted_at: string;
  answers: UserDataResponse;
}

// Get user's data with all relationships resolved
export const getUserData = async (): Promise<UserDataResponse | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const headers = getAuthHeaders();
    const response = await baseAPIClient.get<UserDataResponse>(`/user-data/me`, { headers });

    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// Update user's data
export const updateUserData = async (
  userData: Partial<UserDataResponse>,
): Promise<UserDataResponse | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const headers = getAuthHeaders();

    // Call the PUT /user-data/me endpoint
    const response = await baseAPIClient.put<UserDataResponse>(`/user-data/me`, userData, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error('Error updating user data:', error);
    return null;
  }
};

// Update current user's availability
export const updateMyAvailability = async (
  templates: AvailabilityTemplateResponse[],
): Promise<boolean> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const headers = getAuthHeaders();

    // Convert to backend format (camelCase to snake_case)
    const backendTemplates = templates.map((t) => ({
      day_of_week: t.dayOfWeek,
      start_time: t.startTime,
      end_time: t.endTime,
    }));

    // Call the PUT /availability endpoint
    await baseAPIClient.put(
      `/availability`,
      {
        user_id: userId,
        templates: backendTemplates,
      },
      { headers },
    );

    return true;
  } catch (error) {
    console.error('Error updating availability:', error);
    return false;
  }
};

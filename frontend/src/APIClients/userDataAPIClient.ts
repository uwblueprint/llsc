import baseAPIClient from './baseAPIClient';
import { getCurrentUserId, getAuthHeaders } from '../utils/AuthUtils';

export interface TimeBlockResponse {
    id: number;
    startTime: string; // ISO datetime string (camelCase after conversion)
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
    availability?: TimeBlockResponse[];
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
        const response = await baseAPIClient.get<UserDataResponse>(
            `/user-data/me`,
            { headers }
        );

        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

// Update user's data
export const updateUserData = async (userData: Partial<UserDataResponse>): Promise<UserDataResponse | null> => {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const headers = getAuthHeaders();

        // Call the PUT /user-data/me endpoint
        const response = await baseAPIClient.put<UserDataResponse>(
            `/user-data/me`,
            userData,
            { headers }
        );

        return response.data;
    } catch (error) {
        console.error('Error updating user data:', error);
        return null;
    }
};

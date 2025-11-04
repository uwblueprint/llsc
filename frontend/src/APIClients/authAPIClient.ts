import { signOut as firebaseSignOut } from 'firebase/auth';
import {
  AuthenticatedUser,
  UserCreateResponse,
  LoginRequest,
  AuthResponse,
  RefreshRequest,
  Token,
  UserRole,
  SignUpMethod,
} from '../types/authTypes';

import AUTHENTICATED_USER_KEY from '../constants/AuthConstants';
import baseAPIClient from './baseAPIClient';
import {
  getLocalStorageObj,
  getLocalStorageObjProperty,
  setLocalStorageObjProperty,
} from '../utils/LocalStorageUtils';
import { signInWithEmailAndPassword, applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '@/config/firebase';

// Validation helper
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Authentication result type
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
  errorCode?: string;
  validationErrors?: string[];
}

export const login = async (
  email: string,
  password: string,
  isAdminPortal: boolean = false,
): Promise<AuthResult> => {
  try {
    // Validate inputs
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password' };
    }

    // Attempt Firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        success: false,
        error:
          'Please verify your email address before signing in. Check your inbox for a verification link.',
        errorCode: 'auth/email-not-verified',
      };
    }

    // Attempt backend login
    try {
      const loginRequest: LoginRequest = { email, password };
      const headers: any = { withCredentials: true };

      // Add admin portal header if this is an admin login
      if (isAdminPortal) {
        headers.headers = { 'X-Admin-Portal': 'true' };
      }

      const { data } = await baseAPIClient.post<AuthResponse>('/auth/login', loginRequest, headers);
      localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(data));
      return { success: true, user: { ...data.user, ...data } };
    } catch (error) {
      // Handle admin privilege errors specifically
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { status?: number; data?: { detail?: string } } })
          .response;
        if (response?.status === 403 && isAdminPortal) {
          return {
            success: false,
            error:
              'Access denied. You do not have admin privileges. Please contact an administrator.',
            errorCode: 'auth/insufficient-privileges',
          };
        }
      }

      // Backend login failure is not critical since Firebase auth succeeded
      return {
        success: true,
        user: { email: user.email, uid: user.uid } as unknown as AuthenticatedUser,
      };
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code?: string }).code;

      switch (errorCode) {
        case 'auth/user-not-found':
          return {
            success: false,
            error: 'No account found with this email address. Please sign up first.',
            errorCode,
          };
        case 'auth/wrong-password':
          return { success: false, error: 'Incorrect password. Please try again.', errorCode };
        case 'auth/invalid-credential':
          return {
            success: false,
            error:
              'Invalid email or password. Please check your credentials and try again. If you recently signed up, make sure to verify your email first.',
            errorCode,
          };
        case 'auth/invalid-email':
          return { success: false, error: 'Invalid email address format.', errorCode };
        case 'auth/too-many-requests':
          return {
            success: false,
            error: 'Too many failed attempts. Please try again later.',
            errorCode,
          };
        case 'auth/user-disabled':
          return {
            success: false,
            error: 'This account has been disabled. Please contact support.',
            errorCode,
          };
        default:
          return {
            success: false,
            error: 'Authentication failed. Please check your credentials and try again.',
            errorCode,
          };
      }
    }

    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
};

export const logout = async (): Promise<boolean> => {
  const bearerToken = `Bearer ${getLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'accessToken')}`;

  try {
    // Call backend to revoke tokens
    await baseAPIClient.post('/auth/logout', {}, { headers: { Authorization: bearerToken } });
    return true;
  } catch (error) {
    console.error('Backend logout error:', error);
    return false;
  } finally {
    // Always clear localStorage and sign out from Firebase regardless of backend API success/failure
    localStorage.removeItem(AUTHENTICATED_USER_KEY);
    try {
      await firebaseSignOut(auth);
    } catch (firebaseError) {
      console.error('Firebase sign out error:', firebaseError);
    }
  }
};

// Get current authenticated user from localStorage
export const getCurrentUser = (): AuthenticatedUser => {
  try {
    // Check if we're in a browser environment
    if (globalThis.window === undefined) return null;

    const userDataString = localStorage.getItem(AUTHENTICATED_USER_KEY);
    if (!userDataString) return null;

    const userData = JSON.parse(userDataString);
    if (userData?.user) {
      return { ...userData.user, ...userData } as AuthenticatedUser;
    }
    return userData as AuthenticatedUser;
  } catch (error) {
    console.error('Error retrieving current user:', error);
    return null;
  }
};

export const syncCurrentUser = async (): Promise<AuthenticatedUser> => {
  try {
    const { data } = await baseAPIClient.get<UserCreateResponse>('/auth/me');
    const stored = getLocalStorageObj<Record<string, unknown>>(AUTHENTICATED_USER_KEY) || {};
    const merged = {
      ...stored,
      user: data,
      formStatus: data.formStatus,
    };
    localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(merged));
    return { ...(data as unknown as Record<string, unknown>), ...merged } as AuthenticatedUser;
  } catch (error) {
    console.error('Failed to sync current user:', error);
    return getCurrentUser();
  }
};

export const register = async ({
  first_name,
  last_name,
  email,
  password,
  role = UserRole.PARTICIPANT,
  signupMethod = SignUpMethod.PASSWORD,
}: {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  password: string;
  role?: UserRole;
  signupMethod?: SignUpMethod;
}): Promise<AuthResult> => {
  try {
    const registerRequest = {
      first_name,
      last_name,
      email,
      password,
      role,
      signupMethod,
    };

    // Register user in backend (this creates the Firebase user)
    await baseAPIClient.post<UserCreateResponse>('/auth/register', registerRequest, {
      withCredentials: true,
    });

    console.log('[REGISTER] User registered successfully in backend');

    // Sign in to Firebase to ensure user is authenticated
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('[REGISTER] Firebase sign-in successful, user:', user.email);

      // Note: Email verification will be handled on the verification page
      // This avoids timing issues with Firebase auth state during registration

      // Return success with user info - don't try to login since email isn't verified yet
      return {
        success: true,
        user: { email: user.email, uid: user.uid } as unknown as AuthenticatedUser,
      };
    } catch (firebaseError) {
      console.error('[REGISTER] Firebase sign-in failed:', firebaseError);
      // Continue with registration even if Firebase sign-in fails
      // The user can still verify their email later
      return {
        success: true,
        user: { email, uid: 'unknown' } as unknown as AuthenticatedUser,
      };
    }
  } catch (error) {
    console.error('[REGISTER] Registration failed:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { status?: number; data?: { detail?: string } } })
        .response;
      if (response?.status === 409) {
        return {
          success: false,
          error: 'An account with this email already exists. Please try logging in instead.',
        };
      } else if (response?.status === 400) {
        const detail = response?.data?.detail || 'Invalid registration data';
        return { success: false, error: detail };
      } else if (response?.status === 422) {
        // Pydantic validation errors
        const validationErrors = response?.data?.detail;
        console.log('[REGISTER] Validation errors:', validationErrors);
        if (Array.isArray(validationErrors)) {
          // Extract password validation errors specifically
          const passwordErrors = validationErrors
            .filter((err) => err.loc && err.loc.includes('password'))
            .map((err) => err.msg);

          if (passwordErrors.length > 0) {
            return {
              success: false,
              error: 'password_validation',
              validationErrors: passwordErrors,
            };
          }
        }
        // Fallback for other validation errors
        return { success: false, error: response?.data?.detail || 'Validation failed' };
      }
    }
    return { success: false, error: 'Registration failed. Please try again.' };
  }
};

export const resetPassword = async (
  email: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!validateEmail(email)) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    await baseAPIClient.post(`/auth/resetPassword/${email}`, {}, { withCredentials: true });
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to send reset email. Please try again.' };
  }
};

export const verifyEmail = async (email: string): Promise<boolean> => {
  try {
    await baseAPIClient.post(`/auth/verify/${email}`, {}, { withCredentials: true });
    return true;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'status' in error.response &&
      error.response.status === 404
    ) {
      return false;
    }
    return false;
  }
};

export const verifyEmailWithCode = async (
  oobCode: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify with Firebase
    // Optional: validate action code before applying
    try {
      await checkActionCode(auth, oobCode);
    } catch (codeError) {
      console.error('[VERIFY_EMAIL] checkActionCode failed:', codeError);
      throw codeError;
    }

    await applyActionCode(auth, oobCode);

    // Get the current user to get their email
    const currentUser = auth.currentUser;
    const email = currentUser?.email;

    if (email) {
      // Try to verify with backend (optional)
      try {
        await verifyEmail(email);
      } catch {
        // Backend verification failure is not critical since Firebase verification succeeded
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[VERIFY_EMAIL] Verification failed', error);
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/invalid-action-code') {
        return {
          success: false,
          error: 'Invalid or expired verification link. Please request a new one.',
        };
      } else if (errorCode === 'auth/expired-action-code') {
        return {
          success: false,
          error: 'Verification link has expired. Please request a new one.',
        };
      } else {
        return {
          success: false,
          error: `Verification failed (${errorCode}). Please request a new link.`,
        };
      }
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? `Verification failed: ${error.message}`
          : 'Verification failed. Please try again.',
    };
  }
};

export const refresh = async (): Promise<boolean> => {
  try {
    const refreshToken = getLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'refreshToken');

    const refreshRequest: RefreshRequest = { refreshToken: refreshToken as string };
    const { data } = await baseAPIClient.post<Token>('/auth/refresh', refreshRequest, {
      withCredentials: true,
    });

    setLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'accessToken', data.accessToken);
    setLocalStorageObjProperty(AUTHENTICATED_USER_KEY, 'refreshToken', data.refreshToken);
    return true;
  } catch (error) {
    console.error('Refresh token error:', error);
    return false;
  }
};

import { UserResponse } from '../types/userTypes';

export type { UserResponse };

export interface UserListResponse {
  users: UserResponse[];
  total: number;
}

/**
 * Get all admin users
 */
export const getAdmins = async (): Promise<UserListResponse> => {
  const response = await baseAPIClient.get<UserListResponse>('/users?admin=true');
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserResponse> => {
  const response = await baseAPIClient.get<UserResponse>(`/users/${userId}`);
  return response.data;
};

/**
 * Update user data (profile information, cancer experience, etc.)
 */
export const updateUserData = async (
  userId: string,
  userDataUpdate: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    phone?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    genderIdentity?: string;
    pronouns?: string[];
    ethnicGroup?: string[];
    maritalStatus?: string;
    hasKids?: string;
    timezone?: string;
    diagnosis?: string;
    dateOfDiagnosis?: string;
    treatments?: string[];
    experiences?: string[];
    additionalInfo?: string;
    lovedOneGenderIdentity?: string;
    lovedOneAge?: string;
    lovedOneDiagnosis?: string;
    lovedOneDateOfDiagnosis?: string;
    lovedOneTreatments?: string[];
    lovedOneExperiences?: string[];
  },
): Promise<UserResponse> => {
  // Convert camelCase to snake_case for backend
  const backendData: Record<string, unknown> = {};

  if (userDataUpdate.firstName !== undefined) backendData.first_name = userDataUpdate.firstName;
  if (userDataUpdate.lastName !== undefined) backendData.last_name = userDataUpdate.lastName;
  if (userDataUpdate.dateOfBirth !== undefined)
    backendData.date_of_birth = userDataUpdate.dateOfBirth;
  if (userDataUpdate.phone !== undefined) backendData.phone = userDataUpdate.phone;
  if (userDataUpdate.city !== undefined) backendData.city = userDataUpdate.city;
  if (userDataUpdate.province !== undefined) backendData.province = userDataUpdate.province;
  if (userDataUpdate.postalCode !== undefined) backendData.postal_code = userDataUpdate.postalCode;
  if (userDataUpdate.genderIdentity !== undefined)
    backendData.gender_identity = userDataUpdate.genderIdentity;
  if (userDataUpdate.pronouns !== undefined) backendData.pronouns = userDataUpdate.pronouns;
  if (userDataUpdate.ethnicGroup !== undefined)
    backendData.ethnic_group = userDataUpdate.ethnicGroup;
  if (userDataUpdate.maritalStatus !== undefined)
    backendData.marital_status = userDataUpdate.maritalStatus;
  if (userDataUpdate.hasKids !== undefined) backendData.has_kids = userDataUpdate.hasKids;
  if (userDataUpdate.timezone !== undefined) backendData.timezone = userDataUpdate.timezone;
  if (userDataUpdate.diagnosis !== undefined) backendData.diagnosis = userDataUpdate.diagnosis;
  if (userDataUpdate.dateOfDiagnosis !== undefined) {
    // Convert null to null (to clear date) or keep the date string
    backendData.date_of_diagnosis = userDataUpdate.dateOfDiagnosis;
  }
  if (userDataUpdate.treatments !== undefined) backendData.treatments = userDataUpdate.treatments;
  if (userDataUpdate.experiences !== undefined)
    backendData.experiences = userDataUpdate.experiences;
  if (userDataUpdate.additionalInfo !== undefined)
    backendData.additional_info = userDataUpdate.additionalInfo;
  if (userDataUpdate.lovedOneGenderIdentity !== undefined)
    backendData.loved_one_gender_identity = userDataUpdate.lovedOneGenderIdentity;
  if (userDataUpdate.lovedOneAge !== undefined)
    backendData.loved_one_age = userDataUpdate.lovedOneAge;
  if (userDataUpdate.lovedOneDiagnosis !== undefined)
    backendData.loved_one_diagnosis = userDataUpdate.lovedOneDiagnosis;
  if (userDataUpdate.lovedOneDateOfDiagnosis !== undefined) {
    // Convert null to null (to clear date) or keep the date string
    backendData.loved_one_date_of_diagnosis = userDataUpdate.lovedOneDateOfDiagnosis;
  }
  if (userDataUpdate.lovedOneTreatments !== undefined)
    backendData.loved_one_treatments = userDataUpdate.lovedOneTreatments;
  if (userDataUpdate.lovedOneExperiences !== undefined)
    backendData.loved_one_experiences = userDataUpdate.lovedOneExperiences;

  const response = await baseAPIClient.patch<UserResponse>(
    `/users/${userId}/user-data`,
    backendData,
  );
  return response.data;
};

/**
 * Availability API types and functions
 */
export interface AvailabilityTemplate {
  dayOfWeek: number; // 0=Monday, 1=Tuesday, ..., 6=Sunday
  startTime: string; // Time string in format "HH:MM:SS" or "HH:MM"
  endTime: string; // Time string in format "HH:MM:SS" or "HH:MM"
}

export interface CreateAvailabilityRequest {
  userId: string;
  templates: AvailabilityTemplate[];
}

export interface DeleteAvailabilityRequest {
  userId: string;
  templates: AvailabilityTemplate[];
}

/**
 * Get availability for a user
 */
export const getAvailability = async (
  userId: string,
): Promise<{ templates: AvailabilityTemplate[] }> => {
  const response = await baseAPIClient.get<{
    user_id: string;
    templates: Array<{ day_of_week: number; start_time: string; end_time: string }>;
  }>(`/availability?user_id=${userId}`);
  return {
    templates: response.data.templates.map((t) => ({
      dayOfWeek: t.day_of_week,
      startTime: t.start_time,
      endTime: t.end_time,
    })),
  };
};

/**
 * Create availability for a user
 */
export const createAvailability = async (
  request: CreateAvailabilityRequest,
): Promise<{ userId: string; added: number }> => {
  // Convert camelCase to snake_case for backend
  const backendData = {
    user_id: request.userId,
    templates: request.templates.map((template) => ({
      day_of_week: template.dayOfWeek,
      start_time: template.startTime,
      end_time: template.endTime,
    })),
  };
  const response = await baseAPIClient.post<{ user_id: string; added: number }>(
    '/availability',
    backendData,
  );
  return { userId: response.data.user_id, added: response.data.added };
};

/**
 * Delete availability for a user
 */
export const deleteAvailability = async (
  request: DeleteAvailabilityRequest,
): Promise<{ userId: string; deleted: number; templates: AvailabilityTemplate[] }> => {
  // Convert camelCase to snake_case for backend
  const backendData = {
    user_id: request.userId,
    templates: request.templates.map((template) => ({
      day_of_week: template.dayOfWeek,
      start_time: template.startTime,
      end_time: template.endTime,
    })),
  };
  const response = await baseAPIClient.delete<{
    user_id: string;
    deleted: number;
    templates: Array<{ day_of_week: number; start_time: string; end_time: string }>;
  }>('/availability', { data: backendData });
  return {
    userId: response.data.user_id,
    deleted: response.data.deleted,
    templates: response.data.templates.map((t) => ({
      dayOfWeek: t.day_of_week,
      startTime: t.start_time,
      endTime: t.end_time,
    })),
  };
};

/**
 * Deactivate a user (soft delete)
 */
export const deactivateUser = async (userId: string): Promise<{ message: string }> => {
  const response = await baseAPIClient.post<{ message: string }>(`/users/${userId}/deactivate`);
  return response.data;
};

/**
 * Reactivate a user
 */
export const reactivateUser = async (userId: string): Promise<{ message: string }> => {
  const response = await baseAPIClient.post<{ message: string }>(`/users/${userId}/reactivate`);
  return response.data;
};

/**
 * Delete a user (permanent deletion)
 */
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  const response = await baseAPIClient.delete<{ message: string }>(`/users/${userId}`);
  return response.data;
};

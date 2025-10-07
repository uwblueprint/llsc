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
import { sendEmailVerificationToUser } from '@/services/firebaseAuthService';

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

export const login = async (email: string, password: string, isAdminPortal: boolean = false): Promise<AuthResult> => {
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
        const response = (error as { response?: { status?: number; data?: { detail?: string } } }).response;
        if (response?.status === 403 && isAdminPortal) {
          return {
            success: false,
            error: 'Access denied. You do not have admin privileges. Please contact an administrator.',
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
    await baseAPIClient.post('/auth/logout', {}, { headers: { Authorization: bearerToken } });
    localStorage.removeItem(AUTHENTICATED_USER_KEY);
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
};

// Get current authenticated user from localStorage
export const getCurrentUser = (): AuthenticatedUser => {
  try {
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

      // Wait a moment to ensure Firebase auth state is fully updated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Now send the verification email
      const emailSent = await sendEmailVerificationToUser();
      if (emailSent) {
        console.log('[REGISTER] Email verification sent successfully after registration');
      } else {
        console.warn('[REGISTER] Failed to send email verification after registration');
      }

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

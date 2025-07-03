import { 
    AuthenticatedUser, 
    UserCreateResponse,
    LoginRequest, 
    AuthResponse,
    RefreshRequest,
    Token,
    UserRole,
    SignUpMethod
} from '../types/authTypes';

import AUTHENTICATED_USER_KEY from '../constants/AuthConstants';
import baseAPIClient from './BaseAPIClient';
import { getLocalStorageObjProperty, setLocalStorageObjProperty } from '../utils/LocalStorageUtils';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { sendEmailVerificationToUser } from '@/services/firebaseAuthService';


const login = async (
    email: string,
    password: string,
): Promise<AuthenticatedUser> => {
    try {
        const loginRequest: LoginRequest = { email, password };
        const { data } = await baseAPIClient.post<AuthResponse>(
            "/auth/login",
            loginRequest,
            { withCredentials: true },
        );
        localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(data));
        return { ...data.user, ...data };
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
};

const loginWithGoogle = async (idToken: string): Promise<AuthenticatedUser> => {
    try {
        const { data } = await baseAPIClient.post<AuthResponse>(
            "/auth/login",
            { idToken },
            { withCredentials: true },
        );
        localStorage.setItem(AUTHENTICATED_USER_KEY, JSON.stringify(data));
        return { ...data.user, ...data };
    } catch (error) {
        console.error('Google login error:', error);
        return null;
    }
};

const logout = async (): Promise<boolean> => {
    const bearerToken = `Bearer ${getLocalStorageObjProperty(
        AUTHENTICATED_USER_KEY,
        "accessToken",
    )}`;
    try {
        await baseAPIClient.post(
            "/auth/logout",
            {},
            { headers: { Authorization: bearerToken } },
        );
        localStorage.removeItem(AUTHENTICATED_USER_KEY);
        return true;
    } catch (error) {
        console.error('Logout error:', error);
        return false;
    }
};

export const register = async ({
    first_name,
    last_name,
    email,
    password,
    role = UserRole.PARTICIPANT,
    signupMethod = SignUpMethod.PASSWORD
}: {
    first_name?: string | null,
    last_name?: string | null,
    email: string,
    password: string,
    role?: UserRole,
    signupMethod?: SignUpMethod
}): Promise<AuthenticatedUser> => {
    try {
        const registerRequest = {
            first_name,
            last_name,
            email,
            password,
            role,
            signupMethod
        };

        console.log("Register request body:", registerRequest);

        await baseAPIClient.post<UserCreateResponse>(
            "/auth/register",
            registerRequest,
            { withCredentials: true },
        );
        
        // After successful registration, login to get backend tokens
        const authenticatedUser = await login(email, password);
        
        if (authenticatedUser) {
            // Sign in to Firebase Auth on the frontend
            await signInWithEmailAndPassword(auth, email, password);
            
            // Send email verification
            const emailSent = await sendEmailVerificationToUser();
            if (emailSent) {
                console.log('Email verification sent successfully after registration');
            } else {
                console.warn('Failed to send email verification after registration');
            }
        }
        
        return authenticatedUser;
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific error cases
        if (error && typeof error === 'object' && 'response' in error) {
            const response = (error as { response?: { status?: number; data?: { detail?: string } } }).response;
            if (response?.status === 409) {
                throw new Error('An account with this email already exists. Please try logging in instead.');
            } else if (response?.status === 400) {
                const detail = response?.data?.detail || 'Invalid registration data';
                throw new Error(detail);
            }
        }
        
        throw new Error('Registration failed. Please try again.');
    }
};

const resetPassword = async (email: string | undefined): Promise<boolean> => {
    try {
      await baseAPIClient.post(
        `/auth/resetPassword/${email}`,
        {},
        { withCredentials: true },
      );
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
};

const verifyEmail = async (email: string): Promise<boolean> => {
    try {
      await baseAPIClient.post(
        `/auth/verify/${email}`,
        {},
        { withCredentials: true },
      );
      return true;
    } catch (error: unknown) {
      console.error('Verify email error:', error);
      // If user not found (404), that's expected in some cases
      // If it's a 500 error, that's a real problem
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 404) {
        console.warn('User not found in backend database for email verification');
        return false;
      }
      return false;
    }
};

const refresh = async (): Promise<boolean> => {
    try {
        const refreshToken = getLocalStorageObjProperty(
            AUTHENTICATED_USER_KEY,
            "refreshToken",
        );
        
        const refreshRequest: RefreshRequest = { refreshToken: refreshToken as string };
        const { data } = await baseAPIClient.post<Token>(
            "/auth/refresh",
            refreshRequest,
            { withCredentials: true },
        );
        
        setLocalStorageObjProperty(
            AUTHENTICATED_USER_KEY,
            "accessToken",
            data.accessToken,
        );
        setLocalStorageObjProperty(
            AUTHENTICATED_USER_KEY,
            "refreshToken",
            data.refreshToken,
        );
        return true;
    } catch (error) {
        console.error('Refresh token error:', error);
        return false;
    }
};

export { login, logout, loginWithGoogle, resetPassword, verifyEmail, refresh };

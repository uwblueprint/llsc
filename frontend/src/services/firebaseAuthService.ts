import { 
    sendEmailVerification as firebaseSendEmailVerification,
    sendSignInLinkToEmail,
    ActionCodeSettings
} from 'firebase/auth';
import { auth } from '@/config/firebase';

// Storage keys for email management
const EMAIL_FOR_SIGN_IN_KEY = 'emailForSignIn';

/**
 * Sends email verification to the currently authenticated user
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const sendEmailVerificationToUser = async (): Promise<boolean> => {
    try {
        const user = auth.currentUser;
        console.log('[EMAIL_VERIFICATION] Current auth state:', {
            user: user ? { email: user.email, uid: user.uid, emailVerified: user.emailVerified } : null,
            authState: auth.currentUser ? 'authenticated' : 'not authenticated'
        });
        
        if (!user) {
            console.error('No authenticated user found. User must be signed in to send email verification.');
            return false;
        }

        // Check if email is already verified
        if (user.emailVerified) {
            console.log('Email is already verified');
            return true;
        }

        console.log('[EMAIL_VERIFICATION] Sending verification email to:', user.email);
        await firebaseSendEmailVerification(user);
        console.log('Email verification sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending email verification:', error);
        
        // Log specific error details for debugging
        if (error && typeof error === 'object' && 'code' in error) {
            const errorCode = (error as any).code;
            console.error('Firebase error code:', errorCode);
            
            // Handle specific Firebase error codes
            if (errorCode === 'auth/too-many-requests') {
                console.error('Too many requests. Please wait before trying again.');
            } else if (errorCode === 'auth/invalid-user') {
                console.error('Invalid user state. User may not be properly authenticated.');
            } else if (errorCode === 'auth/user-not-found') {
                console.error('User not found. Authentication state may be invalid.');
            }
        }
        
        return false;
    }
};

/**
 * Sends a sign-in link to the specified email address
 * @param email - The email address to send the sign-in link to
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export const sendSignInLinkToUserEmail = async (email: string): Promise<boolean> => {
    try {
        if (!email || !email.trim()) {
            console.error('Email is required to send sign-in link');
            return false;
        }

        const actionCodeSettings: ActionCodeSettings = {
            url: `${window.location.origin}/action`,
            handleCodeInApp: true,
        };

        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        console.log('Sign-in link sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending sign-in link:', error);
        
        // Log specific error details for debugging
        if (error && typeof error === 'object' && 'code' in error) {
            const errorCode = (error as any).code;
            console.error('Firebase error code:', errorCode);
            
            // Handle specific Firebase error codes
            if (errorCode === 'auth/invalid-email') {
                console.error('Invalid email address provided');
            } else if (errorCode === 'auth/too-many-requests') {
                console.error('Too many requests. Please wait before trying again.');
            }
        }
        
        return false;
    }
};

/**
 * Gets the email stored for sign-in from localStorage
 * @returns string | null - The stored email or null if not found
 */
export const getEmailForSignIn = (): string | null => {
    try {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
        }
        return null;
    } catch (error) {
        console.error('Error getting email for sign-in:', error);
        return null;
    }
};

/**
 * Stores the email for sign-in in localStorage
 * @param email - The email address to store
 */
export const setEmailForSignIn = (email: string): void => {
    try {
        if (typeof window !== 'undefined' && email) {
            localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, email);
        }
    } catch (error) {
        console.error('Error storing email for sign-in:', error);
    }
};

/**
 * Clears the email stored for sign-in from localStorage
 */
export const clearEmailForSignIn = (): void => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
        }
    } catch (error) {
        console.error('Error clearing email for sign-in:', error);
    }
}; 
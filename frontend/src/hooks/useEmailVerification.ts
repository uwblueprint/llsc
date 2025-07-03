import { useState } from 'react';
import { sendEmailVerificationToUser, sendSignInLinkToUserEmail } from '@/services/firebaseAuthService';

export const useEmailVerification = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const sendVerificationEmail = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await sendEmailVerificationToUser();
            if (result) {
                setSuccess(true);
            } else {
                setError('Failed to send verification email');
            }
        } catch (err) {
            setError('An error occurred while sending verification email');
            console.error('Email verification error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const sendSignInLink = async (email: string) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await sendSignInLinkToUserEmail(email);
            if (result) {
                setSuccess(true);
            } else {
                setError('Failed to send sign-in link');
            }
        } catch (err) {
            setError('An error occurred while sending sign-in link');
            console.error('Sign-in link error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setSuccess(false);
    };

    return {
        sendVerificationEmail,
        sendSignInLink,
        isLoading,
        error,
        success,
        reset
    };
}; 
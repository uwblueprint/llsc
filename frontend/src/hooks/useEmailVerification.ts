import { useState } from 'react';
import baseAPIClient from '@/APIClients/baseAPIClient';

export const useEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendVerificationEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await baseAPIClient.post(`/auth/send-email-verification/${encodeURIComponent(email)}`, {}, {
        withCredentials: true,
      });
      setSuccess(true);
    } catch (err) {
      setError('An error occurred while sending verification email');
      console.error('Email verification error:', err);
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
    isLoading,
    error,
    success,
    reset,
  };
};

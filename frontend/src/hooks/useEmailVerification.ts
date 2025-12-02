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
      // Get browser language from navigator - check all languages in preference order
      let detectedLang = 'en';

      // Check navigator.languages array first (user's preferred languages in order)
      if (navigator.languages && navigator.languages.length > 0) {
        for (const lang of navigator.languages) {
          const langCode = lang.split('-')[0].toLowerCase();
          if (langCode === 'fr') {
            detectedLang = 'fr';
            break;
          } else if (langCode === 'en') {
            detectedLang = 'en';
            // Continue checking in case French comes later
          }
        }
      } else if (navigator.language) {
        // Fallback to navigator.language
        const langCode = navigator.language.split('-')[0].toLowerCase();
        detectedLang = langCode === 'fr' ? 'fr' : 'en';
      }

      await baseAPIClient.post(
        `/auth/send-email-verification/${encodeURIComponent(email)}?language=${detectedLang}`,
        {},
        {
          withCredentials: true,
        },
      );
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

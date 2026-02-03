import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, defaultLocale, locales } from '@/i18n/config';
import { useAuth } from './AuthContext';
import baseAPIClient from '@/APIClients/baseAPIClient';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const { user } = useAuth();

  // Initialize locale on mount
  useEffect(() => {
    const initializeLocale = () => {
      // Priority 1: User's stored preference (if authenticated)
      if (user?.user?.language) {
        const userLang = user.user.language.toLowerCase();
        if (locales.includes(userLang as Locale)) {
          setLocaleState(userLang as Locale);
          setCookie(userLang as Locale);
          return;
        }
      }

      // Priority 2: Cookie
      const cookieLocale = getCookie(LOCALE_COOKIE_NAME);
      if (cookieLocale && locales.includes(cookieLocale as Locale)) {
        setLocaleState(cookieLocale as Locale);
        return;
      }

      // Priority 3: Browser language
      if (typeof window !== 'undefined') {
        const browserLang = navigator.language.split('-')[0];
        if (locales.includes(browserLang as Locale)) {
          setLocaleState(browserLang as Locale);
          setCookie(browserLang as Locale);
          return;
        }
      }

      // Priority 4: Default
      setLocaleState(defaultLocale);
      setCookie(defaultLocale);
    };

    initializeLocale();
  }, [user]);

  const setLocale = async (newLocale: Locale) => {
    if (!locales.includes(newLocale)) {
      console.error(`Invalid locale: ${newLocale}`);
      return;
    }

    setLocaleState(newLocale);
    setCookie(newLocale);

    // If user is authenticated, update their language preference in the backend
    if (user?.accessToken) {
      try {
        await baseAPIClient.put(
          '/user-data/me',
          { language: newLocale }, // Backend expects lowercase 'en' or 'fr'
          {
            headers: { Authorization: `Bearer ${user.accessToken}` },
          },
        );
      } catch (error) {
        console.error('Error updating user language preference:', error);
      }
    }

    // Reload page to apply new locale
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const value: LanguageContextType = {
    locale,
    setLocale,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }

  return null;
}

function setCookie(locale: Locale) {
  if (typeof document === 'undefined') return;

  // Set cookie for 1 year
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; expires=${expires.toUTCString()}; path=/`;
}

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

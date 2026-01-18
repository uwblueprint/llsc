import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { NextIntlClientProvider } from 'next-intl';
import { Provider } from '@/components/ui/provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { defaultLocale, type Locale, locales } from '@/i18n/config';

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

export default function App({ Component, pageProps }: AppProps) {
  const [messages, setMessages] = useState<any>(null);
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  useEffect(() => {
    // Determine locale from cookie or browser
    const cookieLocale = getCookie('NEXT_LOCALE');
    let detectedLocale: Locale = defaultLocale;

    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      detectedLocale = cookieLocale as Locale;
    } else if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      if (locales.includes(browserLang as Locale)) {
        detectedLocale = browserLang as Locale;
      }
    }

    setLocale(detectedLocale);

    // Load all message namespaces for the detected locale
    Promise.all([
      import(`@/locales/${detectedLocale}/common.json`),
      import(`@/locales/${detectedLocale}/auth.json`),
      import(`@/locales/${detectedLocale}/intake.json`),
      import(`@/locales/${detectedLocale}/ranking.json`),
      import(`@/locales/${detectedLocale}/options.json`),
      import(`@/locales/${detectedLocale}/dashboard.json`),
    ])
      .then(([common, auth, intake, ranking, options, dashboard]) => {
        setMessages({
          common: common.default,
          auth: auth.default,
          intake: intake.default,
          ranking: ranking.default,
          options: options.default,
          dashboard: dashboard.default,
        });
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
        // Fallback to default locale
        Promise.all([
          import(`@/locales/${defaultLocale}/common.json`),
          import(`@/locales/${defaultLocale}/auth.json`),
          import(`@/locales/${defaultLocale}/intake.json`),
          import(`@/locales/${defaultLocale}/ranking.json`),
          import(`@/locales/${defaultLocale}/options.json`),
          import(`@/locales/${defaultLocale}/dashboard.json`),
        ]).then(([common, auth, intake, ranking, options, dashboard]) => {
          setMessages({
            common: common.default,
            auth: auth.default,
            intake: intake.default,
            ranking: ranking.default,
            options: options.default,
            dashboard: dashboard.default,
          });
        });
      });
  }, []);

  if (!messages) {
    return null; // Or a loading spinner
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/Toronto">
      <Provider>
        <AuthProvider>
          <LanguageProvider>
            <Component {...pageProps} />
          </LanguageProvider>
        </AuthProvider>
      </Provider>
    </NextIntlClientProvider>
  );
}

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './config';

export default getRequestConfig(async () => {
  // Get locale from cookie
  const cookieStore = await cookies();
  let locale = cookieStore.get('NEXT_LOCALE')?.value as Locale | undefined;

  // Validate locale
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}/common.json`)).default,
  };
});

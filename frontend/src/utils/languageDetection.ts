/**
 * Detects the user's preferred language from browser settings.
 * Checks navigator.languages (preferred language list) and respects the order.
 * Returns 'fr' if French is the user's preferred language, otherwise defaults to 'en'.
 *
 * SSR-safe: Returns 'en' if navigator is not available (server-side rendering, tests, etc.)
 *
 * @returns 'en' or 'fr'
 */
export const detectUserLanguage = (): 'en' | 'fr' => {
  // SSR guard - navigator is only available in browser
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  // Check navigator.languages array first (user's preferred languages in order)
  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const langCode = lang.split('-')[0].toLowerCase();
      // Return first match - this respects user's language preference order
      if (langCode === 'fr') {
        return 'fr';
      } else if (langCode === 'en') {
        return 'en';
      }
    }
  } else if (navigator.language) {
    // Fallback to navigator.language
    const langCode = navigator.language.split('-')[0].toLowerCase();
    return langCode === 'fr' ? 'fr' : 'en';
  }

  // Default to English
  return 'en';
};

/**
 * Returns the appropriate LLSC program information URL based on the user's language.
 *
 * @param language - The user's preferred language ('en' or 'fr')
 * @returns The URL for the First Connection Peer Support Program page
 */
export const getProgramInfoUrl = (language: 'en' | 'fr'): string => {
  return language === 'fr'
    ? 'https://www.cancersdusang.ca/programme-de-soutien-par-les-pairs-premier-contact'
    : 'https://www.bloodcancers.ca/first-connection-peer-support-program';
};

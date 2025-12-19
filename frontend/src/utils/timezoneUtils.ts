/**
 * Detects the user's timezone and maps it to Canadian timezone abbreviations.
 * Returns one of: NST, AST, EST, CST, MST, PST, or empty string if detection fails.
 */
export function detectCanadianTimezone(): string {
  try {
    // Use Intl API to get the IANA timezone identifier
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Map IANA timezone identifiers to Canadian timezone abbreviations
    const timezoneMap: Record<string, string> = {
      // Newfoundland Standard Time
      'America/St_Johns': 'NST',

      // Atlantic Standard Time
      'America/Halifax': 'AST',
      'America/Moncton': 'AST',
      'America/Glace_Bay': 'AST',
      'America/Goose_Bay': 'AST',
      'America/Blanc-Sablon': 'AST',

      // Eastern Standard Time
      'America/Toronto': 'EST',
      'America/Montreal': 'EST',
      'America/Ottawa': 'EST',
      'America/Thunder_Bay': 'EST',
      'America/Nipigon': 'EST',
      'America/Rainy_River': 'EST',
      'America/Atikokan': 'EST',

      // Central Standard Time
      'America/Winnipeg': 'CST', // Manitoba uses Central Time
      'America/Regina': 'CST',
      'America/Swift_Current': 'CST',

      // Mountain Standard Time
      'America/Edmonton': 'MST',
      'America/Calgary': 'MST',
      'America/Yellowknife': 'MST',
      'America/Inuvik': 'MST',
      'America/Cambridge_Bay': 'MST',
      'America/Dawson_Creek': 'MST',
      'America/Fort_Nelson': 'MST',

      // Pacific Standard Time
      'America/Vancouver': 'PST',
      'America/Whitehorse': 'PST',
      'America/Dawson': 'PST',
    };

    // Check if we have a direct mapping
    if (timezoneMap[timeZone]) {
      return timezoneMap[timeZone];
    }

    // Fallback: Use timezone offset to estimate
    // Get UTC offset in hours (accounting for DST)
    const now = new Date();
    const offsetMinutes = now.getTimezoneOffset();
    const offsetHours = -offsetMinutes / 60; // Invert because getTimezoneOffset returns opposite sign

    // Map UTC offsets to Canadian timezones (accounting for DST)
    // During DST, offsets are shifted by 1 hour, so we map to standard time equivalents
    if (offsetHours === -3.5 || offsetHours === -2.5) return 'NST'; // Newfoundland (standard or daylight)
    if (offsetHours === -4 || offsetHours === -3) return 'AST'; // Atlantic (standard or daylight)
    if (offsetHours === -5 || offsetHours === -4) return 'EST'; // Eastern (standard or daylight)
    if (offsetHours === -6 || offsetHours === -5) return 'CST'; // Central (standard or daylight)
    if (offsetHours === -7 || offsetHours === -6) return 'MST'; // Mountain (standard or daylight)
    if (offsetHours === -8 || offsetHours === -7) return 'PST'; // Pacific (standard or daylight)

    return '';
  } catch (error) {
    console.warn('Unable to detect timezone:', error);
    return '';
  }
}

/**
 * Extracts the timezone abbreviation from a full timezone name.
 * Example: "Eastern Standard Time (EST)" -> "EST"
 * If the input is already an abbreviation, returns it as-is.
 */
export function extractTimezoneAbbreviation(timezone: string): string {
  if (!timezone) return '';

  // If it's already an abbreviation (3-4 letters), return as-is
  if (/^[A-Z]{2,4}$/.test(timezone.trim())) {
    return timezone.trim().toUpperCase();
  }

  // Extract abbreviation from format like "Eastern Standard Time (EST)"
  const match = timezone.match(/\(([A-Z]{2,4})\)/);
  if (match && match[1]) {
    return match[1];
  }

  // Fallback: return as-is if no pattern matches
  return timezone.trim();
}

/**
 * Converts a timezone abbreviation to the full display name.
 * Example: "EST" -> "Eastern Standard Time (EST)"
 */
export function getTimezoneDisplayName(abbreviation: string): string {
  const timezoneMap: Record<string, string> = {
    NST: 'Newfoundland Standard Time (NST)',
    AST: 'Atlantic Standard Time (AST)',
    EST: 'Eastern Standard Time (EST)',
    CST: 'Central Standard Time (CST)',
    MST: 'Mountain Standard Time (MST)',
    PST: 'Pacific Standard Time (PST)',
  };

  return timezoneMap[abbreviation.toUpperCase()] || abbreviation;
}

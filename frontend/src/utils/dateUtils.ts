/**
 * Format a date to show "Today", "Tomorrow", or day of week (e.g., "Friday")
 * @param dateString - ISO 8601 datetime string
 * @returns Formatted date string
 */
export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    // Return day of week (e.g., "Friday")
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
}

/**
 * Format a date to show month and day (e.g., "Feb 26")
 * @param dateString - ISO 8601 datetime string
 * @returns Formatted date string
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a date to show full date (e.g., "February 26, 2024")
 * @param dateString - ISO 8601 datetime string
 * @returns Formatted date string
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Format a time to show in 12-hour format (e.g., "12:00PM")
 * @param dateString - ISO 8601 datetime string
 * @returns Formatted time string
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace(/\s/g, ''); // Remove spaces, e.g., "12:00 PM" -> "12:00PM"
}

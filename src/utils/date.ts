/**
 * Date Utility Helpers for StudyOS
 */

/**
 * Returns today's date formatted nicely for display (e.g., "Monday, Oct 24")
 */
export function formatTodayHeader(): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };
  return new Date().toLocaleDateString('en-US', options);
}

/**
 * Converts minutes to a human-readable hours and minutes string (e.g. 75 -> "1h 15m")
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

/**
 * Date formatting utilities
 */

/**
 * Format a date string to "Month Day, Year" format
 * Example: "January 12, 2026"
 */
export const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Format a month string (YYYY-MM) to "Month Year" format
 * Example: "2026-01" -> "January 2026"
 */
export const formatMonth = (monthString?: string) => {
  if (!monthString) return '';
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Format a date string to "MMM Dth" format with ordinal suffix
 * Example: "Feb 4th", "Jan 1st", "Mar 22nd"
 */
export const formatShortDateWithOrdinal = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const suffix = ['th', 'st', 'nd', 'rd'][((day % 100) - 20) % 10] || ['th', 'st', 'nd', 'rd'][day % 100] || 'th';
  return `${month} ${day}${suffix}`;
};

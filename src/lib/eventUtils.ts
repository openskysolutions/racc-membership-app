/**
 * Common utility functions for event formatting and display
 */

/**
 * Format a date string to a readable date format
 * @param date - ISO date string
 * @returns Formatted date string (e.g., "Monday, October 29, 2025")
 */
export const formatEventDate = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a date string to a readable time format
 * @param date - ISO date string
 * @returns Formatted time string (e.g., "3:00 PM")
 */
export const formatEventTime = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Format a location string by removing the country (last part after final comma)
 * @param location - Full location string (e.g., "Monroe, Utah, United States")
 * @returns Shortened location string (e.g., "Monroe, Utah")
 */
export const formatLocation = (location: string): string => {
  if (!location) return '';
  // Split by comma and remove the last part (usually the country)
  const parts = location.split(',').map(part => part.trim());
  if (parts.length > 1) {
    // Remove the last part (country) and rejoin
    return parts.slice(0, -1).join(', ');
  }
  return location;
};

/**
 * Calculate the duration between two dates
 * @param startTime - Start date ISO string
 * @param endTime - End date ISO string
 * @returns Formatted duration string (e.g., "2 hours 30 minutes")
 */
export const getEventDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const duration = Math.abs(end.getTime() - start.getTime());
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes} minutes`;
  if (minutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} minutes`;
};

/**
 * Format a date string to a short date format
 * @param dateString - ISO date string
 * @returns Short formatted date string (e.g., "Mon, Oct 29, 2025")
 */
export const formatShortEventDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

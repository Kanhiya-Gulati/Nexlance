/**
 * Utility Helper Functions
 * Common formatting and display utilities used across the application.
 */

/**
 * formatDate - Format a date string to 'Jan 15, 2024' format.
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

/**
 * formatBudget - Format a budget range with dollar signs and commas.
 * Returns '$500 - $1,000' or '$500' if only min is provided.
 * @param {number} min - Minimum budget
 * @param {number} max - Maximum budget (optional)
 * @returns {string} Formatted budget string
 */
export const formatBudget = (min, max) => {
  const formatNum = (num) => {
    if (num === undefined || num === null) return null;
    return `$${Number(num).toLocaleString('en-US')}`;
  };

  const formattedMin = formatNum(min);
  const formattedMax = formatNum(max);

  if (formattedMin && formattedMax) {
    return `${formattedMin} - ${formattedMax}`;
  }
  if (formattedMin) return formattedMin;
  if (formattedMax) return formattedMax;
  return 'N/A';
};

/**
 * getInitials - Get the first letters of the first two words in a name.
 * Returns 'JD' for 'John Doe'.
 * @param {string} name - Full name
 * @returns {string} Initials (uppercase)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
};

/**
 * formatRelativeTime - Format a date as a relative time string.
 * Returns 'just now', '2 hours ago', '3 days ago', etc.
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  try {
    const now = new Date();
    const past = new Date(date);
    if (isNaN(past.getTime())) return '';

    const diffMs = now - past;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
};

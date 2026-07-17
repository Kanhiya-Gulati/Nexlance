/**
 * Validation Helper Utilities
 * Reusable validation functions for request data
 */

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets requirements (min 6 chars)
 */
const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate that all required fields are present
 * @param {Array<{value: any, name: string}>} fields - Array of field objects to check
 * @returns {string[]} Array of missing field names (empty if all present)
 */
const validateRequired = (fields) => {
  const missing = [];
  for (const field of fields) {
    if (
      field.value === undefined ||
      field.value === null ||
      field.value === ''
    ) {
      missing.push(field.name);
    }
  }
  return missing;
};

module.exports = { validateEmail, validatePassword, validateRequired };

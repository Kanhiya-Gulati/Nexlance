import api from './api';

/**
 * Profile Service
 * Backend routes are mounted at /api/profile/
 * Backend returns: { success, user }
 */

/**
 * Get a user's profile by ID.
 * @param {string} id - User ID
 */
export const getProfile = async (id) => {
  const res = await api.get(`/profile/${id}`);
  return res.data; // { success, user }
};

/**
 * Update the current user's profile.
 * @param {object} data - Profile data (name, bio, skills, location, etc.)
 */
export const updateProfile = async (data) => {
  const res = await api.put('/profile', data);
  return res.data; // { success, user }
};

/**
 * Upload a user avatar image.
 * @param {FormData} formData - FormData containing the avatar file
 */
export const uploadAvatar = async (formData) => {
  const res = await api.post('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { success, user }
};

/**
 * Add a review for a freelancer.
 * @param {string} freelancerId - The freelancer's user ID
 * @param {object} reviewData - { rating, reviewText, projectName }
 */
export const addReview = async (freelancerId, reviewData) => {
  const res = await api.post(`/profile/${freelancerId}/review`, reviewData);
  return res.data; // { success, review }
};

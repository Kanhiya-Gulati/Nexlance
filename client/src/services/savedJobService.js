import api from './api';

/**
 * Saved Job Service
 * Backend returns: { success, saved, savedJobs } for toggle, { success, savedJobs } for list
 */

export const toggleSaveJob = async (jobId) => {
  const res = await api.post(`/saved-jobs/${jobId}`);
  return res.data; // { success, saved, savedJobs }
};

export const getSavedJobs = async () => {
  const res = await api.get('/saved-jobs');
  return res.data; // { success, savedJobs }
};

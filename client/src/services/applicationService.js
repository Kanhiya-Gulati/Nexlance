import api from './api';

/**
 * Application Service
 * Backend returns: { success, applications } or { success, application }
 */

export const applyForJob = async (data) => {
  const res = await api.post('/applications', data);
  return res.data; // { success, application }
};

export const getJobApplications = async (jobId) => {
  const res = await api.get(`/applications/job/${jobId}`);
  return res.data; // { success, applications }
};

// Route is /applications/my (not /me)
export const getMyApplications = async () => {
  const res = await api.get('/applications/my');
  return res.data; // { success, applications }
};

export const updateApplicationStatus = async (id, data) => {
  const res = await api.patch(`/applications/${id}/status`, data);
  return res.data; // { success, application }
};

export const completeProject = async (jobId) => {
  const res = await api.patch(`/applications/complete/${jobId}`);
  return res.data;
};

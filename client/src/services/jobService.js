import api from './api';

/**
 * Job Service
 * API methods for managing jobs (CRUD operations).
 * Backend returns: { success, jobs } for list, { success, job } for single
 */

export const getJobs = async (params) => {
  const res = await api.get('/jobs', { params });
  return res.data; // { success, jobs, totalPages, currentPage, totalJobs }
};

export const getJob = async (id) => {
  const res = await api.get(`/jobs/${id}`);
  return res.data; // { success, job }
};

export const createJob = async (data) => {
  const res = await api.post('/jobs', data);
  return res.data; // { success, job }
};

export const updateJob = async (id, data) => {
  const res = await api.put(`/jobs/${id}`, data);
  return res.data; // { success, job }
};

export const deleteJob = async (id) => {
  const res = await api.delete(`/jobs/${id}`);
  return res.data; // { success, message }
};

export const updateJobStatus = async (id, status) => {
  const res = await api.patch(`/jobs/${id}/status`, { status });
  return res.data; // { success, job }
};

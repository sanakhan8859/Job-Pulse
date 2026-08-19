import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 15000,
});

export async function fetchJobs(params) {
  const { data } = await api.get('/jobs', { params });
  return data;
}

export async function fetchJobById(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function fetchStats() {
  const { data } = await api.get('/jobs/stats');
  return data;
}

export async function fetchIngestionStatus() {
  const { data } = await api.get('/ingestion/status');
  return data;
}

export default api;
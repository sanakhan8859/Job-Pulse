import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJobs } from '../api/client';

export default function useJobs(filters) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async (params) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobs(params);
      // Ignore stale responses if a newer request already landed
      if (currentRequest !== requestId.current) return;
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(err?.response?.data?.message || 'Could not reach the job service.');
      setItems([]);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [filters, load]);

  return { items, pagination, loading, error, reload: () => load(filters) };
}

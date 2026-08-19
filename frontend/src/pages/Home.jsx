import { useEffect, useMemo, useState } from 'react';
import { Frown, Inbox } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import JobCard from '../components/JobCard';
import JobModal from '../components/JobModal';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import IngestionStatus from '../components/IngestionStatus';
import useJobs from '../hooks/useJobs';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { fetchStats, fetchIngestionStatus } from '../api/client';

const DEFAULT_FILTERS = { search: '', location: '', remote: '', tags: '', sort: 'newest', page: 1 };

export default function Home() {
  const [rawFilters, setRawFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(rawFilters.search, 400);
  const debouncedLocation = useDebouncedValue(rawFilters.location, 400);

  const effectiveFilters = useMemo(
    () => ({ ...rawFilters, search: debouncedSearch, location: debouncedLocation }),
    [rawFilters, debouncedSearch, debouncedLocation]
  );

  const { items, pagination, loading, error } = useJobs(effectiveFilters);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const loadSidebarData = async () => {
    setRefreshing(true);
    try {
      const [s, st] = await Promise.all([fetchStats(), fetchIngestionStatus()]);
      setStats(s);
      setStatus(st);
    } catch {
      // Sidebar data is supplementary — a failure here shouldn't break the job list.
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSidebarData();
    const interval = setInterval(loadSidebarData, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateFilters = (patch) => setRawFilters((prev) => ({ ...prev, ...patch, page: 1 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Find your next role
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {stats ? `${stats.total} active listings, ${stats.remoteCount} remote` : 'Loading listings…'}
        </p>
      </div>

      <div className="mb-6">
        <SearchBar value={rawFilters.search} onChange={(v) => updateFilters({ search: v })} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <FilterPanel filters={rawFilters} onChange={updateFilters} topTags={stats?.topTags} />
          <IngestionStatus status={status} onRefresh={loadSidebarData} refreshing={refreshing} />
        </aside>

        <main>
          {loading && <LoadingSkeleton />}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-rose-200 bg-rose-50 py-16 text-center">
              <Frown className="mb-3 text-rose-400" size={32} />
              <p className="text-sm font-medium text-rose-600">{error}</p>
              <p className="mt-1 text-xs text-rose-400">Check that the backend API is running and reachable.</p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <Inbox className="mb-3 text-slate-300" size={32} />
              <p className="text-sm font-medium text-slate-500">No listings match those filters.</p>
              <p className="mt-1 text-xs text-slate-400">Try widening your search or clearing filters.</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((job) => (
                  <JobCard key={job._id} job={job} onOpen={setSelectedJob} />
                ))}
              </div>
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onChange={(p) => setRawFilters((prev) => ({ ...prev, page: p }))}
              />
            </>
          )}
        </main>
      </div>

      <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}

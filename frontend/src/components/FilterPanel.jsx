import { SlidersHorizontal } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export default function FilterPanel({ filters, onChange, topTags = [] }) {
  const toggleTag = (tag) => {
    const current = filters.tags ? filters.tags.split(',').filter(Boolean) : [];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    onChange({ tags: next.join(',') });
  };

  const activeTags = filters.tags ? filters.tags.split(',').filter(Boolean) : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <SlidersHorizontal size={15} />
        Filters
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Location contains</label>
          <input
            type="text"
            value={filters.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="e.g. Remote, Berlin, India"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Work type</label>
          <div className="flex gap-2">
            {[
              { label: 'All', value: '' },
              { label: 'Remote', value: 'true' },
              { label: 'On-site', value: 'false' },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => onChange({ remote: opt.value })}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                  filters.remote === opt.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Sort by</label>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {topTags.length > 0 && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Popular tags</label>
            <div className="flex flex-wrap gap-1.5">
              {topTags.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => toggleTag(t.tag)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    activeTags.includes(t.tag)
                      ? 'border-brand-500 bg-brand-600 text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {t.tag} <span className="opacity-60">· {t.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

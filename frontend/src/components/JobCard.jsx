import { Building2, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function JobCard({ job, onOpen }) {
  const posted = job.postedAt ? new Date(job.postedAt) : null;

  return (
    <div
      onClick={() => onOpen(job)}
      className="group flex cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover animate-fade-in"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900 group-hover:text-brand-700">
            {job.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <Building2 size={13} /> {job.company || 'Unknown company'}
          </p>
        </div>
        {job.remote && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
            Remote
          </span>
        )}
      </div>

      <p className="mb-4 line-clamp-3 text-sm text-slate-500">
        {job.description ? job.description.replace(/<[^>]*>/g, '') : 'No description provided.'}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(job.tags || []).slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin size={12} /> {job.location || 'Not specified'}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {posted ? formatDistanceToNow(posted, { addSuffix: true }) : 'Recently'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
        View details <ArrowUpRight size={13} />
      </div>
    </div>
  );
}

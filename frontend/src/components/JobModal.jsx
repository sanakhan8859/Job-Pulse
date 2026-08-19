import { X, Building2, MapPin, Clock, ExternalLink, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function JobModal({ job, onClose }) {
  if (!job) return null;
  const posted = job.postedAt ? new Date(job.postedAt) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl animate-fade-in sm:rounded-2xl"
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{job.title}</h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <Building2 size={14} /> {job.company || 'Unknown company'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <MapPin size={12} /> {job.location || 'Not specified'}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <Clock size={12} /> {posted ? formatDistanceToNow(posted, { addSuffix: true }) : 'Recently'}
            </span>
            {job.remote && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-600">Remote</span>
            )}
            {(job.jobTypes || []).map((t) => (
              <span key={t} className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-600">
                {t.replace('_', ' ')}
              </span>
            ))}
          </div>

          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-slate-700">
            {job.description ? (
              <div dangerouslySetInnerHTML={{ __html: job.description }} />
            ) : (
              <p className="text-slate-400">No description provided by the source.</p>
            )}
          </div>

          {job.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-1.5">
              <Tag size={13} className="text-slate-400" />
              {job.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-slate-100 bg-white px-6 py-4">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
          >
            View original listing <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

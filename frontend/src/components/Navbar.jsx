import { Briefcase, RadioTower } from 'lucide-react';

export default function Navbar({ status }) {
  const lastRun = status?.lastRun;
  const isHealthy = lastRun?.status === 'success' || lastRun?.status === 'partial';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-card">
            <Briefcase size={18} />
          </div>
          <div>
            <p className="text-base font-bold leading-none text-slate-900">JobPulse</p>
            <p className="text-[11px] leading-none text-slate-400 mt-0.5">Aggregated listings, refreshed automatically</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 sm:flex">
          <RadioTower size={14} className={isHealthy ? 'text-emerald-500' : 'text-amber-500'} />
          <span className="text-xs font-medium text-slate-600">
            {lastRun
              ? `Last sync: ${lastRun.status} · ${lastRun.itemsUpserted ?? 0} updated`
              : 'Waiting for first sync…'}
          </span>
        </div>
      </div>
    </header>
  );
}

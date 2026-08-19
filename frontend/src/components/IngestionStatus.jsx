import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, PauseCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const STATUS_META = {
  success: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Healthy' },
  partial: { icon: AlertTriangle, color: 'text-amber-500', label: 'Partial' },
  failed: { icon: XCircle, color: 'text-rose-500', label: 'Failed' },
  skipped_circuit_open: { icon: PauseCircle, color: 'text-slate-400', label: 'Paused (circuit open)' },
};

export default function IngestionStatus({ status, onRefresh, refreshing }) {
  const lastRun = status?.lastRun;
  const meta = STATUS_META[lastRun?.status] || STATUS_META.failed;
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Ingestion status</h3>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {lastRun ? (
        <div className="space-y-2 text-xs text-slate-500">
          <div className={`flex items-center gap-1.5 font-medium ${meta.color}`}>
            <Icon size={14} /> {meta.label}
          </div>
          <p>
            Last run{' '}
            <span className="font-medium text-slate-700">
              {formatDistanceToNow(new Date(lastRun.createdAt), { addSuffix: true })}
            </span>{' '}
            ({lastRun.trigger})
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Stat label="Fetched" value={lastRun.itemsFetched ?? 0} />
            <Stat label="Upserted" value={lastRun.itemsUpserted ?? 0} />
            <Stat label="Skipped" value={lastRun.itemsSkippedInvalid ?? 0} />
            <Stat label="Marked stale" value={lastRun.staleMarked ?? 0} />
          </div>
          {lastRun.warnings?.length > 0 && (
            <div className="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-700">
              {lastRun.warnings[0]}
            </div>
          )}
          {lastRun.errorMessage && (
            <div className="mt-2 rounded-lg bg-rose-50 p-2 text-[11px] text-rose-700">{lastRun.errorMessage}</div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-400">No ingestion runs yet.</p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
      <p className="text-sm font-bold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

export default function LoadingSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="skeleton mb-3 h-4 w-3/4 rounded" />
          <div className="skeleton mb-4 h-3 w-1/2 rounded" />
          <div className="skeleton mb-2 h-3 w-full rounded" />
          <div className="skeleton mb-2 h-3 w-full rounded" />
          <div className="skeleton mb-4 h-3 w-2/3 rounded" />
          <div className="flex gap-1.5">
            <div className="skeleton h-5 w-14 rounded-full" />
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

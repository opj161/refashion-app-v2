export default function AdminLoading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-muted/50 rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>

      {/* Activity chart skeleton */}
      <div className="h-[426px] bg-muted/50 rounded-lg animate-pulse" />

      {/* Table + insights skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <div
            className="h-[188px] bg-muted/50 rounded-lg animate-pulse"
          />
          <div
            className="h-[188px] bg-muted/50 rounded-lg animate-pulse"
            style={{ animationDelay: '0.1s' }}
          />
        </div>
      </div>
    </div>
  );
}

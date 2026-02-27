import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
      {/* Page header skeleton */}
      <header className="text-center py-4">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-md" />
          <Skeleton className="h-10 w-64 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-5 w-80 mx-auto rounded-md" />
      </header>

      {/* History gallery skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

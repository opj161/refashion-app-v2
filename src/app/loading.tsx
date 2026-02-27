import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 pb-10 space-y-8">
      {/* Creation hub skeleton */}
      <div className="space-y-6 pt-6">
        {/* Upload area skeleton */}
        <Skeleton className="h-64 w-full rounded-xl" />

        {/* Parameters row skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>

        {/* Generate button skeleton */}
        <Skeleton className="h-12 w-48 mx-auto rounded-lg" />
      </div>

      {/* History gallery skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="aspect-2/3 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

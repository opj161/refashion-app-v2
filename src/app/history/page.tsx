import { Suspense } from 'react';
import HistoryGallery from "@/components/history-gallery";
import { PageHeader } from "@/components/ui/page-header";
import { History } from "lucide-react";
import { getHistoryPaginated } from '@/actions/historyActions';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering for user-specific content
// export const dynamic = 'force-dynamic';

import { connection } from 'next/server';

export default async function HistoryPage() {
  await connection();
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
        <PageHeader
          icon={History}
          title="Creation History"
          description="Review your past image and video generations."
        />
        <Suspense fallback={<HistoryGallerySkeleton />}>
          <UserHistoryLoader />
        </Suspense>
      </div>
    </div>
  );
}

async function UserHistoryLoader() {
  try {
    const initialHistory = await getHistoryPaginated(1, 9, 'all');
    return <HistoryGallery initialHistory={initialHistory} />;
  } catch (error) {
    // Handle cases where there's no user session (e.g., during build time)
    console.warn('[UserHistoryLoader] Unable to fetch history:', error instanceof Error ? error.message : String(error));
    // Return empty state when no user is available
    const emptyHistory = { items: [], totalCount: 0, hasMore: false, currentPage: 1 };
    return <HistoryGallery initialHistory={emptyHistory} />;
  }
}

function HistoryGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
      ))}
    </div>
  );
}

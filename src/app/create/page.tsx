import { Suspense } from 'react';
import CreationHub from '@/components/creation-hub';
import { PageHeader } from "@/components/ui/page-header";
import { Palette } from "lucide-react";
import HistoryGallery from '@/components/history-gallery';
import { getHistoryPaginated } from '@/actions/historyActions';
import { Skeleton } from '@/components/ui/skeleton';

// This is now an async Server Component
export default async function CreatePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 space-y-8">
      <PageHeader
        icon={Palette}
        title="Creation Hub"
        description="Generate new fashion images and videos using your uploaded clothing."
      />
      {/* CreationHub is now a child that receives the server-rendered history as children */}
      <CreationHub>
        <Suspense fallback={<HistoryGallerySkeleton />}>
          <UserHistory />
        </Suspense>
      </CreationHub>
    </div>
  );
}

async function UserHistory() {
  try {
    // Fetch initial history data on the server for the logged-in user
    const initialHistory = await getHistoryPaginated(1, 9, 'all');
    return <HistoryGallery initialHistory={initialHistory} />;
  } catch (error) {
    // Handle cases where there's no user session (e.g., during build time)
    console.warn('[UserHistory] Unable to fetch history:', error instanceof Error ? error.message : String(error));
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

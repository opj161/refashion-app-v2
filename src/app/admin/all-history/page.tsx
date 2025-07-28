import { Suspense } from 'react';
import { getAllUsersHistoryPaginatedForAdmin } from '@/actions/historyActions';
import { HistoryGallery } from './_components/HistoryGallery';
import { HistoryGallerySkeleton } from './_components/HistoryGallerySkeleton';

// This is now an async Server Component. It renders the static shell of the page instantly.
export default function AllHistoryPage() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">All Users History (Admin)</h1>
      {/* Suspense provides a fallback while the data is fetched on the server. */}
      <Suspense fallback={<HistoryGallerySkeleton />}>
        <HistoryLoader />
      </Suspense>
    </main>
  );
}

// This separate async component fetches the data. This allows the main page
// component to render its static parts immediately without waiting for the data fetch.
async function HistoryLoader() {
  try {
    const initialHistory = await getAllUsersHistoryPaginatedForAdmin(1, 9);
    if (!initialHistory || initialHistory.items.length === 0) {
      return <div className="text-center text-muted-foreground py-8">No user history found.</div>;
    }
    // The client component receives the initial data as a prop.
    return <HistoryGallery initialHistory={initialHistory} />;
  } catch (error) {
    // Handle cases where there's no admin user session (e.g., during build time)
    console.warn('[AdminHistoryLoader] Unable to fetch admin history:', error instanceof Error ? error.message : String(error));
    // Return empty state when no admin user is available
    const emptyHistory = { items: [], hasMore: false };
    return <HistoryGallery initialHistory={emptyHistory} />;
  }
}

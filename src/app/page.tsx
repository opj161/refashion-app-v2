import { Suspense } from 'react';
import CreationHub from '@/components/creation-hub';
import HistoryGallery from '@/components/history-gallery';
import { getHistoryPaginated } from '@/actions/historyActions';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/actions/authActions';
import { findUserByUsername } from '@/services/database.service';

// Force dynamic rendering for user-specific content
// export const dynamic = 'force-dynamic';

import { connection } from 'next/server';

// Simplified Server Component - no more searchParams handling
export default async function CreatePage() {
  await connection();
  
  const sessionUser = await getCurrentUser();
  let maxImages = 3; // Default to 3
  let recentUploads: string[] = [];
  let userModel = 'fal_gemini_2_5'; // NEW: Default

  if (sessionUser?.username) {
    const fullUser = findUserByUsername(sessionUser.username);
    console.log(`[CreatePage] User: ${sessionUser.username}, Model: ${fullUser?.image_generation_model}`);
    
    if (fullUser?.image_generation_model) { // NEW: Capture model
      userModel = fullUser.image_generation_model;
    }

    if (fullUser?.image_generation_model === 'fal_nano_banana_pro') {
      maxImages = 1;
    }

    // Fetch recent uploads
    try {
      const { getRecentUploadsAction } = await import('@/actions/historyActions');
      recentUploads = await getRecentUploadsAction();
    } catch (e) {
      console.error("Failed to fetch recent uploads:", e);
    }
  }
  console.log(`[CreatePage] maxImages determined: ${maxImages}`);

  return (
    <div className="container mx-auto max-w-7xl px-4 pb-10 space-y-8">
      {/* CreationHub now manages state entirely on the client */}
      <CreationHub maxImages={maxImages} recentUploads={recentUploads} userModel={userModel}>
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

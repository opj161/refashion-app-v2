import { Suspense } from 'react';
import CreationHub from '@/components/creation-hub';
import HistoryGallery from '@/components/history-gallery';
import { getHistoryPaginated, getRecentUploadsAction } from '@/actions/historyActions';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/actions/authActions';
import { findUserByUsername } from '@/services/db';

import { connection } from 'next/server';

// Simplified Server Component - no more searchParams handling
export default async function CreatePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await connection();
  await props.searchParams; // Await params in Next.js 16
  
  const sessionUser = await getCurrentUser();
  let maxImages = 3; // Default to 3
  let recentUploads: string[] = [];
  let userModel = 'fal_gemini_2_5'; // NEW: Default

  if (sessionUser?.username) {
    const fullUser = findUserByUsername(sessionUser.username);
    
    if (fullUser?.image_generation_model) { // NEW: Capture model
      userModel = fullUser.image_generation_model;
    }

    if (fullUser?.image_generation_model === 'fal_nano_banana_pro') {
      maxImages = 1;
    }

    // Fetch recent uploads
    try {
      recentUploads = await getRecentUploadsAction();
    } catch (e) {
      console.error("Failed to fetch recent uploads:", e);
    }
  }

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
  let initialHistory;
  try {
    initialHistory = await getHistoryPaginated(1, 9, 'all');
  } catch (error) {
    console.warn('[UserHistory] Unable to fetch history:', error instanceof Error ? error.message : String(error));
    initialHistory = { items: [], totalCount: 0, hasMore: false, currentPage: 1 };
  }
  return <HistoryGallery initialHistory={initialHistory} />;
}

function HistoryGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <Skeleton key={i} className="aspect-2/3 rounded-lg" />
      ))}
    </div>
  );
}

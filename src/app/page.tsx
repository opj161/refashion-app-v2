import { Suspense } from 'react';
import { Workspace } from '@/components/workspace';
import { getHistoryPaginated } from '@/actions/historyActions';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/actions/authActions';
import { findUserByUsername } from '@/services/database.service';
import { connection } from 'next/server';

// Main workspace page - uses fixed viewport layout
export default async function CreatePage() {
  await connection();
  
  const sessionUser = await getCurrentUser();
  let maxImages = 3; // Default to 3
  let recentUploads: string[] = [];
  let userModel = 'fal_gemini_2_5'; // Default

  if (sessionUser?.username) {
    const fullUser = findUserByUsername(sessionUser.username);
    console.log(`[CreatePage] User: ${sessionUser.username}, Model: ${fullUser?.image_generation_model}`);
    
    if (fullUser?.image_generation_model) {
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
    <Suspense fallback={<WorkspaceSkeleton />}>
      <WorkspaceLoader 
        maxImages={maxImages} 
        recentUploads={recentUploads} 
        userModel={userModel} 
      />
    </Suspense>
  );
}

// Server component that fetches history
async function WorkspaceLoader({ 
  maxImages, 
  recentUploads, 
  userModel 
}: { 
  maxImages: number; 
  recentUploads: string[]; 
  userModel: string; 
}) {
  let initialHistory;
  
  try {
    initialHistory = await getHistoryPaginated(1, 9, 'all');
  } catch (error) {
    console.warn('[WorkspaceLoader] Unable to fetch history:', error instanceof Error ? error.message : String(error));
    initialHistory = { items: [], totalCount: 0, hasMore: false, currentPage: 1 };
  }

  return (
    <Workspace 
      maxImages={maxImages} 
      recentUploads={recentUploads} 
      userModel={userModel}
      initialHistory={initialHistory}
    />
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </div>
    </div>
  );
}

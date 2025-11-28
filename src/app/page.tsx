import { getCurrentUser } from '@/actions/authActions';
import { findUserByUsername } from '@/services/database.service';
import { connection } from 'next/server';

// Workspace Components
import { WorkspaceShell } from '@/components/layout/WorkspaceShell';
import { InputStage } from '@/components/workspace/InputStage';
import { ControlRack } from '@/components/workspace/ControlRack';
import { OutputGallery } from '@/components/workspace/OutputGallery';

// Dynamic import for actions to ensure server-only code isn't leaked
const getRecentUploads = async () => {
  const { getRecentUploadsAction } = await import('@/actions/historyActions');
  return getRecentUploadsAction();
};

export default async function CreatePage() {
  // 1. Await connection for dynamic rendering
  await connection();

  // 2. Fetch user context
  const sessionUser = await getCurrentUser();

  // Defaults
  let maxImages = 3;
  let recentUploads: string[] = [];
  let userModel = 'fal_gemini_2_5';

  if (sessionUser?.username) {
    // Fetch full user profile for model preferences
    const fullUser = findUserByUsername(sessionUser.username);

    if (fullUser?.image_generation_model) {
      userModel = fullUser.image_generation_model;
    }

    // Configure limitations based on model
    if (fullUser?.image_generation_model === 'fal_nano_banana_pro') {
      maxImages = 1;
    }

    // Fetch user assets
    try {
      recentUploads = await getRecentUploads();
    } catch (e) {
      console.error("Failed to fetch recent uploads:", e);
    }
  }

  // 3. Compose the Layout using Named Slots pattern
  return (
    <div className="h-full w-full flex flex-col bg-background">
      <WorkspaceShell
        inputPanel={<InputStage recentUploads={recentUploads} />}
        controlPanel={<ControlRack maxImages={maxImages} userModel={userModel} />}
        outputPanel={<OutputGallery userId={sessionUser?.username} maxImages={maxImages} />}
      />
    </div>
  );
}

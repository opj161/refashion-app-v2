// src/services/megaBackup.service.ts

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Uploads a single file to a specified path in MEGA.
 * This function is designed to be non-blocking ("fire-and-forget").
 * @param localFilePath The absolute path to the file inside the container.
 * @param remoteMegaPath The destination folder in MEGA.
 */
async function uploadFileToMega(localFilePath: string, remoteMegaPath: string): Promise<void> {
  const fileName = path.basename(localFilePath);
  console.log(`[MegaBackup] Starting upload of ${fileName} to ${remoteMegaPath}`);

  try {
    // The `mega-put` command handles the upload.
    // We quote the paths to handle spaces or special characters.
    const command = `mega-put "${localFilePath}" "${remoteMegaPath}"`;
    
    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      // mega-cmd often prints progress to stderr, so we check for actual error keywords.
      if (stderr.toLowerCase().includes('error')) {
        throw new Error(stderr);
      } else {
        console.log(`[MegaBackup] stderr (progress info): ${stderr}`);
      }
    }

    console.log(`[MegaBackup] Successfully uploaded ${fileName}. stdout: ${stdout}`);
  } catch (error) {
    console.error(`[MegaBackup] Failed to upload ${fileName}. Error:`, error);
    // In a production system, you might add this failure to a retry queue.
  }
}

/**
 * Triggers a background upload to MEGA if the backup feature is enabled.
 * It does not block the main application flow.
 * @param localRelativePath The application-relative path to the file (e.g., /uploads/generated_images/...).
 */
export function triggerMegaBackup(localRelativePath: string): void {
  if (process.env.MEGA_BACKUP_ENABLED !== 'true') {
    return;
  }

  const remoteMegaPath = process.env.MEGA_REMOTE_BACKUP_PATH;
  if (!remoteMegaPath) {
    console.warn('[MegaBackup] Backup is enabled but MEGA_REMOTE_BACKUP_PATH is not set. Skipping upload.');
    return;
  }

  // Construct the full, absolute path inside the container
  const absoluteFilePath = path.join(process.cwd(), localRelativePath);

  // Fire-and-forget: start the upload but don't wait for it to finish.
  // The self-executing async function with its own catch block ensures
  // that any errors here won't crash the main application.
  (async () => {
    await uploadFileToMega(absoluteFilePath, remoteMegaPath);
  })().catch(err => {
    console.error(`[MegaBackup] Unhandled exception in background upload process for ${localRelativePath}:`, err);
  });
}

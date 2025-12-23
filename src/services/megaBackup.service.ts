// src/services/megaBackup.service.ts
import 'server-only';

// SECURITY FIX: Use spawn instead of exec to prevent command injection
// spawn executes the binary directly without shell interpretation
import { spawn } from 'child_process';
import path from 'path';

/**
 * Validates and sanitizes a file path to prevent path traversal attacks.
 * @param filePath The path to validate
 * @returns The validated absolute path
 * @throws Error if path is invalid or attempts traversal
 */
function validateFilePath(filePath: string): string {
  const uploadsBase = path.resolve(process.cwd(), 'uploads');
  const absolutePath = path.resolve(filePath);

  // Ensure the path is within the uploads directory
  if (!absolutePath.startsWith(uploadsBase + path.sep) && absolutePath !== uploadsBase) {
    throw new Error('[MegaBackup] Security: Attempted to access file outside uploads directory');
  }

  return absolutePath;
}

/**
 * Uploads a single file to a specified path in MEGA.
 * This function is designed to be non-blocking ("fire-and-forget").
 *
 * SECURITY: Uses spawn() instead of exec() to prevent command injection.
 * Arguments are passed directly to the binary without shell interpretation.
 *
 * @param localFilePath The absolute path to the file inside the container.
 * @param remoteMegaPath The destination folder in MEGA.
 */
async function uploadFileToMega(localFilePath: string, remoteMegaPath: string): Promise<void> {
  const fileName = path.basename(localFilePath);

  return new Promise((resolve, reject) => {
    // SECURITY: spawn does not invoke a shell. Arguments are passed directly to the binary.
    // This neutralizes command injection attacks like `; rm -rf /` or `$(malicious command)`.
    const child = spawn('mega-put', [localFilePath, remoteMegaPath]);

    let stderrData = '';

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[MegaBackup] Successfully uploaded ${fileName}.`);
        resolve();
      } else {
        console.error(`[MegaBackup] Upload failed for ${fileName} with exit code ${code}`);
        if (stderrData) console.error(`[MegaBackup] stderr: ${stderrData}`);
        reject(new Error(`mega-put process exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.error(`[MegaBackup] Failed to spawn process for ${fileName}.`, err);
      reject(err);
    });
  });
}

/**
 * Triggers a background upload to MEGA if the backup feature is enabled.
 * It does not block the main application flow.
 *
 * NOTE: MEGA backup is DISABLED by default for security reasons.
 * To enable, set MEGA_BACKUP_ENABLED=true in environment variables.
 *
 * @param localRelativePath The application-relative path to the file (e.g., /uploads/generated_images/...).
 */
export function triggerMegaBackup(localRelativePath: string): void {
  // SECURITY: Backup is disabled by default
  if (process.env.MEGA_BACKUP_ENABLED !== 'true') {
    return;
  }

  const remoteMegaPath = process.env.MEGA_REMOTE_BACKUP_PATH;
  if (!remoteMegaPath) {
    console.warn('[MegaBackup] Backup is enabled but MEGA_REMOTE_BACKUP_PATH is not set. Skipping upload.');
    return;
  }

  try {
    // Construct and validate the absolute path
    const absoluteFilePath = path.join(process.cwd(), localRelativePath);
    const validatedPath = validateFilePath(absoluteFilePath);

    // Fire-and-forget: start the upload but don't wait for it to finish.
    uploadFileToMega(validatedPath, remoteMegaPath).catch(err => {
      console.error(`[MegaBackup] Unhandled exception in background upload process for ${localRelativePath}:`, err);
    });
  } catch (validationError) {
    console.error(`[MegaBackup] Path validation failed:`, validationError);
  }
}

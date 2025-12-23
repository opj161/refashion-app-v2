// SECURITY FIX: Removed 'use server' directive
// This file is now a pure utility library and cannot be called directly from the client.
// It should only be imported by Server Actions or other server-side code.

import 'server-only';

/**
 * @fileOverview Centralized storage service for handling file downloads and local storage
 *
 * This service provides a unified way to download files from URLs and save them locally
 * with proper permissions and naming conventions. It eliminates code duplication across
 * different actions that need to save files.
 *
 * SECURITY: All filename inputs are sanitized to prevent path traversal and command injection.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { triggerMegaBackup } from './megaBackup.service';

/**
 * SECURITY: Sanitizes a filename/prefix to prevent path traversal and command injection.
 * Allows only alphanumeric characters, hyphens, and underscores.
 * @param name The name to sanitize
 * @returns The sanitized name
 */
function sanitizeFilename(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'file';
  }
  // Allow only alphanumeric characters, hyphens, and underscores
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, '');
  // Ensure we have a valid name (not empty after sanitization)
  return sanitized || 'file';
}

/**
 * SECURITY: Validates that a path is within the uploads directory.
 * @param targetPath The path to validate
 * @returns The validated absolute path
 * @throws Error if path attempts directory traversal
 */
function validateUploadPath(targetPath: string): string {
  const uploadsBase = path.resolve(process.cwd(), 'uploads');
  const absolutePath = path.resolve(targetPath);

  if (!absolutePath.startsWith(uploadsBase + path.sep) && absolutePath !== uploadsBase) {
    throw new Error('Security: Attempted to access path outside uploads directory');
  }

  return absolutePath;
}

/**
 * Downloads a file from a URL and saves it locally with proper permissions
 * @param sourceUrl The URL to download the file from
 * @param fileNamePrefix The prefix to use for the generated filename
 * @param subfolder The subfolder within /uploads/ to save to
 * @param extension The file extension (defaults to 'png')
 * @returns Promise<string> The relative URL path to the saved file
 */
export async function saveFileFromUrl(
  sourceUrl: string,
  fileNamePrefix: string,
  subfolder: string,
  extension: string = 'png'
): Promise<{ relativeUrl: string; hash: string }> {
  // SECURITY: Sanitize inputs
  const safePrefix = sanitizeFilename(fileNamePrefix);
  const safeSubfolder = sanitizeFilename(subfolder);
  const safeExtension = sanitizeFilename(extension) || 'png';

  console.log(`Downloading from ${sourceUrl} to save in /uploads/${safeSubfolder}`);
  try {
    // If sourceUrl points at a local uploads path, read it directly and return it (no HTTP fetch).
    const uploadsPrefix = '/uploads/';
    const apiImagesPrefix = '/api/images/';

    if (sourceUrl.startsWith(uploadsPrefix) || sourceUrl.startsWith(apiImagesPrefix)) {
      // If /api/images/... was supplied map back to /uploads/...
      let uploadsPath = sourceUrl.startsWith(apiImagesPrefix)
        ? sourceUrl.replace(new RegExp(`^${apiImagesPrefix}`), uploadsPrefix)
        : sourceUrl;

      const trimmed = uploadsPath.replace(/^\/+/, '');
      const abs = path.resolve(process.cwd(), trimmed);

      // SECURITY: Validate the path is within uploads
      validateUploadPath(abs);

      const buffer = await fs.readFile(abs);
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
      // Return the existing relative URL (no copy). If you prefer to copy into subfolder,
      // replace this return with a copy flow using fs.copyFile -> new relativeUrl.
      return { relativeUrl: uploadsPath, hash: fileHash };
    }

    // Otherwise, download remotely and save into uploads/{subfolder}
    const response = await fetch(sourceUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const destFolder = path.join(process.cwd(), 'uploads', safeSubfolder);

    // SECURITY: Validate destination is within uploads
    validateUploadPath(destFolder);

    await fs.mkdir(destFolder, { recursive: true });
    const fileName = `${safePrefix}-${uuidv4()}.${safeExtension}`;
    const destPath = path.join(destFolder, fileName);

    // SECURITY: Final validation of complete path
    validateUploadPath(destPath);

    await fs.writeFile(destPath, buffer);
    const relativeUrl = `/uploads/${safeSubfolder}/${fileName}`;
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    // Optionally trigger backups / side effects
    triggerMegaBackup(relativeUrl);
    return { relativeUrl, hash: fileHash };
  } catch (err) {
    console.error('saveFileFromUrl error', err);
    throw err;
  }
}

/**
 * Saves a Buffer locally with proper permissions and calculates its hash.
 * @param buffer The file buffer to save
 * @param fileNamePrefix The prefix to use for the generated filename
 * @param subfolder The subfolder within /uploads/ to save to
 * @param extension The file extension for the output file
 * @returns Promise<{ relativeUrl: string; hash: string }> The relative URL path and hash of the saved file
 */
export async function saveFileFromBuffer(
  buffer: Buffer,
  fileNamePrefix: string,
  subfolder: string,
  extension: string
): Promise<{ relativeUrl: string; hash: string }> {
  // SECURITY: Sanitize inputs
  const safePrefix = sanitizeFilename(fileNamePrefix);
  const safeSubfolder = sanitizeFilename(subfolder);
  const safeExtension = sanitizeFilename(extension) || 'png';

  console.log(`Saving buffer to /uploads/${safeSubfolder}`);
  try {
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const uniqueFileName = `${safePrefix}_${uuidv4()}.${safeExtension}`;
    const uploadDir = path.join(process.cwd(), 'uploads', safeSubfolder);

    // SECURITY: Validate path is within uploads
    validateUploadPath(uploadDir);

    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFileName);

    // SECURITY: Final validation of complete path
    validateUploadPath(filePath);

    await fs.writeFile(filePath, buffer);

    try {
      await fs.chmod(filePath, 0o664);
      console.log(`Set file permissions to 664 for: ${filePath}`);
    } catch (chmodError) {
      console.warn(`Warning: Could not set file permissions for ${filePath}:`, chmodError);
    }

    const puid = process.env.PUID;
    const pgid = process.env.PGID;
    if (puid && pgid) {
      try {
        await fs.chown(filePath, parseInt(puid, 10), parseInt(pgid, 10));
        console.log(`Set file ownership to ${puid}:${pgid} for: ${filePath}`);
      } catch (chownError) {
        console.warn(`Warning: Could not set file ownership for ${filePath}:`, chownError);
      }
    }

    const relativeUrl = `/uploads/${safeSubfolder}/${uniqueFileName}`;
    console.log(`Buffer saved to: ${filePath}, accessible at: ${relativeUrl}`);
    // Trigger MEGA backup after successful save
    triggerMegaBackup(relativeUrl);
    return { relativeUrl, hash: fileHash };
  } catch (error) {
    console.error(`Error saving buffer:`, error);
    throw new Error(`Failed to save buffer: ${(error as Error).message}`);
  }
}

/**
 * Saves a data URI (base64 encoded image) locally with proper permissions
 * @param dataUri The data URI to save (e.g., "data:image/png;base64,...")
 * @param fileNamePrefix The prefix to use for the generated filename
 * @param subfolder The subfolder within /uploads/ to save to
 * @returns Promise<string> The relative URL path to the saved file
 */
export async function saveDataUriLocally(
  dataUri: string,
  fileNamePrefix: string,
  subfolder: string
): Promise<{ relativeUrl: string; hash: string }> {
  // SECURITY: Sanitize inputs
  const safePrefix = sanitizeFilename(fileNamePrefix);
  const safeSubfolder = sanitizeFilename(subfolder);

  console.log(`Saving data URI to /uploads/${safeSubfolder}`);
  try {
    // Parse data URI
    const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid data URI format');
    }
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const extension = sanitizeFilename(mimeType.split('/')[1]) || 'png';
    // Calculate hash
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
    // Generate unique filename
    const uniqueFileName = `${safePrefix}_${uuidv4()}.${extension}`;

    // Create upload directory path
    const uploadDir = path.join(process.cwd(), 'uploads', safeSubfolder);

    // SECURITY: Validate path is within uploads
    validateUploadPath(uploadDir);

    // Ensure directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, uniqueFileName);

    // SECURITY: Final validation of complete path
    validateUploadPath(filePath);

    await fs.writeFile(filePath, buffer);

    // Set proper permissions and ownership
    try {
      await fs.chmod(filePath, 0o664);
      console.log(`Set file permissions to 664 for: ${filePath}`);
    } catch (chmodError) {
      console.warn(`Warning: Could not set file permissions for ${filePath}:`, chmodError);
    }

    const puid = process.env.PUID;
    const pgid = process.env.PGID;
    if (puid && pgid) {
      try {
        await fs.chown(filePath, parseInt(puid, 10), parseInt(pgid, 10));
        console.log(`Set file ownership to ${puid}:${pgid} for: ${filePath}`);
      } catch (chownError) {
        console.warn(`Warning: Could not set file ownership for ${filePath}:`, chownError);
      }
    }
    // Return relative URL
    const relativeUrl = `/uploads/${safeSubfolder}/${uniqueFileName}`;
    console.log(`Data URI saved to: ${filePath}, accessible at: ${relativeUrl}`);
    // Trigger MEGA backup after successful save
    triggerMegaBackup(relativeUrl);
    return { relativeUrl, hash: fileHash };
  } catch (error) {
    console.error(`Error saving data URI:`, error);
    throw new Error(`Failed to save data URI: ${(error as Error).message}`);
  }
}

/**
 * Downloads an image from a FAL.AI URL and saves it locally with proper permissions
 * This ensures consistency with the rest of the system that expects local file paths
 * @param sourceUrl The FAL.AI URL to download the image from
 * @param fileNamePrefix The prefix to use for the generated filename
 * @param subfolder The subfolder within /uploads/ to save to
 * @returns Promise<{relativeUrl: string, hash: string}> The relative URL path to the saved file and its hash
 */
export async function downloadAndSaveImageFromUrl(
  sourceUrl: string,
  fileNamePrefix: string,
  subfolder: string
): Promise<{ relativeUrl: string; hash: string }> {
  // SECURITY: Sanitize inputs (also done in saveFileFromUrl, but defense in depth)
  const safePrefix = sanitizeFilename(fileNamePrefix);
  const safeSubfolder = sanitizeFilename(subfolder);

  console.log(`Downloading FAL.AI image from ${sourceUrl} to save in /uploads/${safeSubfolder}`);

  try {
    // Use the existing saveFileFromUrl function which handles URL downloads and local storage
    // This maintains consistency with the existing codebase
    const result = await saveFileFromUrl(sourceUrl, safePrefix, safeSubfolder, 'png');

    console.log(`Successfully downloaded and saved FAL.AI image: ${result.relativeUrl}`);
    return result;
  } catch (error) {
    console.error(`Error downloading FAL.AI image from ${sourceUrl}:`, error);
    throw new Error(`Failed to download and save FAL.AI image: ${(error as Error).message}`);
  }
}

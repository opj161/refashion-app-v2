'use server';

import 'server-only';

import fs from 'fs/promises';
import path from 'path';

/**
 * Securely reads a file from the /uploads directory.
 * Prevents path traversal attacks by ensuring the resolved path is within the uploads directory.
 * @param relativePath The server-relative path, e.g., /uploads/processed_images/image.png
 * @returns A Promise resolving to the file Buffer.
 * @throws An Error if the path is invalid, not within /uploads/, or the file doesn't exist.
 */
export async function getBufferFromLocalPath(relativePath: string): Promise<Buffer> {
  if (!relativePath.startsWith('/uploads/')) {
    throw new Error('Invalid path: Must be within /uploads/');
  }

  // Additional security check: reject paths with null bytes
  if (relativePath.includes('\0')) {
    throw new Error('Invalid path: Must be within /uploads/');
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  // path.join normalizes the path, helping to resolve ".." segments.
  const absoluteFilePath = path.join(uploadsDir, relativePath.slice('/uploads/'.length));

  // Final security check: ensure the resolved path is still within the intended directory after normalization.
  if (!absoluteFilePath.startsWith(uploadsDir)) {
    throw new Error('Forbidden: Path traversal attempt detected.');
  }

  return await fs.readFile(absoluteFilePath);
}

import { createReadStream } from 'fs';

/**
 * Securely gets a readable stream for a file in the /uploads directory.
 * @param relativePath The server-relative path.
 * @returns A Promise resolving to a ReadableStream.
 */
export async function getStreamFromLocalPath(relativePath: string): Promise<ReadableStream> {
  const { stream } = await getFileStream(relativePath);
  return stream;
}

/**
 * Securely gets a Web Stream and file size for a local file.
 * Supports partial content ranges for video streaming efficiency.
 */
export async function getFileStream(
  relativePath: string, 
  options?: { start?: number; end?: number }
): Promise<{ stream: ReadableStream; size: number; contentType: string }> {
  
  // 1. Path Normalization & Validation
  // Support both raw paths and API paths for backward compatibility during transition
  const cleanPath = relativePath.replace(/^\/api\/images/, '/uploads');
  
  if (!cleanPath.startsWith('/uploads/')) {
    throw new Error('Invalid path: Must be within /uploads/');
  }
  
  if (cleanPath.includes('\0')) {
    throw new Error('Invalid path: Null byte detected');
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const absoluteFilePath = path.join(uploadsDir, cleanPath.slice('/uploads/'.length));

  if (!absoluteFilePath.startsWith(uploadsDir)) {
    throw new Error('Forbidden: Path traversal attempt detected.');
  }

  // 2. File Stats & MIME Type
  // dynamic import for mime-types to ensure server-side compatibility
  const mime = (await import('mime-types')).default;
  const stats = await fs.stat(absoluteFilePath);
  const contentType = mime.lookup(absoluteFilePath) || 'application/octet-stream';
  
  // 3. Handle Byte Ranges
  const start = options?.start ?? 0;
  const end = options?.end ?? stats.size - 1;
  
  // Create Node.js native ReadStream for the specific range
  // This prevents loading unnecessary bytes into memory
  const nodeStream = createReadStream(absoluteFilePath, { start, end });
  
  // Convert to Web Standard ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      nodeStream.on('data', (chunk) => {
        controller.enqueue(chunk);
      });
      nodeStream.on('end', () => {
        controller.close();
      });
      nodeStream.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      nodeStream.destroy();
    }
  });

  return { stream: webStream, size: stats.size, contentType };
}
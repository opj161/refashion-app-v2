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

/**
 * Securely gets a readable stream for a file in the /uploads directory.
 * @param relativePath The server-relative path.
 * @returns A Promise resolving to a ReadableStream.
 */
export async function getStreamFromLocalPath(relativePath: string): Promise<ReadableStream> {
  if (!relativePath.startsWith('/uploads/')) {
    throw new Error('Invalid path: Must be within /uploads/');
  }

  if (relativePath.includes('\0')) {
    throw new Error('Invalid path: Must be within /uploads/');
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const absoluteFilePath = path.join(uploadsDir, relativePath.slice('/uploads/'.length));

  if (!absoluteFilePath.startsWith(uploadsDir)) {
    throw new Error('Forbidden: Path traversal attempt detected.');
  }

  // Verify file exists first
  await fs.access(absoluteFilePath);

  const { createReadStream } = await import('fs');
  const { Readable } = await import('stream');
  
  const nodeStream = createReadStream(absoluteFilePath);
  // @ts-ignore - Types for toWeb might be missing in some envs but it exists in Node 18+
  return Readable.toWeb(nodeStream) as ReadableStream;
}

export async function getFileStream(relativePath: string): Promise<{ stream: ReadableStream; size: number }> {
  if (!relativePath.startsWith('/uploads/')) {
    throw new Error('Invalid path: Must be within /uploads/');
  }
  
  if (relativePath.includes('\0')) {
    throw new Error('Invalid path: Null byte detected');
  }

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const absoluteFilePath = path.join(uploadsDir, relativePath.slice('/uploads/'.length));

  if (!absoluteFilePath.startsWith(uploadsDir)) {
    throw new Error('Forbidden: Path traversal attempt detected.');
  }

  // Get file size for Content-Length header
  const stats = await fs.stat(absoluteFilePath);
  
  const { createReadStream } = await import('fs');
  const { Readable } = await import('stream');
  
  // Create Node.js stream
  const nodeStream = createReadStream(absoluteFilePath);
  
  // Convert to Web Stream (Next.js Native Response expects this)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return { stream: webStream, size: stats.size };
}
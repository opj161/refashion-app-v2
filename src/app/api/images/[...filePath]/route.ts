import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getFileStream } from '@/lib/server-fs.utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filePath: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filePathParts = resolvedParams.filePath;
    
    if (!filePathParts || filePathParts.length === 0) {
      return new NextResponse('File path is required', { status: 400 });
    }

    // Reconstruct the path. The rewrite maps /uploads/a.png -> /api/images/a.png
    const requestedPath = path.join(...filePathParts);
    const uploadsPath = `/uploads/${requestedPath}`;
    
    // --- RANGE REQUEST HANDLING ---
    // Essential for video seeking and performance
    const rangeHeader = request.headers.get('range');
    let start: number | undefined;
    let end: number | undefined;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : undefined;
    }

    const { stream, size, contentType } = await getFileStream(uploadsPath, { start, end });
    
    // --- RESPONSE HEADERS ---
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    // Immutable caching: Files are named with UUIDs, so they never change content.
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    // Tell the browser we support seeking
    headers.set('Accept-Ranges', 'bytes');

    // Case 1: Range Request (Video Streaming)
    if (rangeHeader && start !== undefined) {
      const calculatedEnd = end ?? (size - 1);
      const chunksize = (calculatedEnd - start) + 1;

      headers.set('Content-Range', `bytes ${start}-${calculatedEnd}/${size}`);
      headers.set('Content-Length', chunksize.toString());

      return new NextResponse(stream, {
        status: 206, // Partial Content
        headers,
      });
    }

    // Case 2: Standard Request (Full File)
    headers.set('Content-Length', size.toString());

    return new NextResponse(stream, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    // Handle expected filesystem errors gracefully
    if (error.message && (error.message.includes('ENOENT') || error.code === 'ENOENT')) {
      return new NextResponse('File not found', { status: 404 });
    }
    if (error.message && error.message.includes('Forbidden')) {
       return new NextResponse('Forbidden', { status: 403 });
    }
    
    console.error('Error serving media:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
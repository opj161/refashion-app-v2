import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import mime from 'mime-types';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';

export const dynamic = 'force-static';

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

    // Construct the uploads path and use secure utility
    const requestedPath = path.join(...filePathParts);
    const uploadsPath = `/uploads/${requestedPath}`;
    
    const fileBuffer = await getBufferFromLocalPath(uploadsPath);
    const mimeType = mime.lookup(uploadsPath) || 'application/octet-stream';

    // By creating a Blob from a Uint8Array view of the Buffer, we ensure the
    // NextResponse receives a standard Web API object, resolving the type conflict.
    // This pattern is consistent with other parts of the codebase (e.g., video actions).
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse('Image not found', { status: 404 });
    }
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
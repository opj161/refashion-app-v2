import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import mime from 'mime-types';
import { getFileStream } from '@/lib/server-fs.utils';

// export const dynamic = 'force-dynamic'; // Removed in favor of connection() or implicit dynamic

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

    const requestedPath = path.join(...filePathParts);
    const uploadsPath = `/uploads/${requestedPath}`;
    
    // USE STREAM INSTEAD OF BUFFER
    const { stream, size } = await getFileStream(uploadsPath);
    
    const mimeType = mime.lookup(uploadsPath) || 'application/octet-stream';

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': size.toString(),
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
// src/app/api/admin/download-export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/actions/authActions';
import path from 'path';
import fs from 'fs';
import { stat } from 'fs/promises';
import os from 'os';

// Helper to convert Node.js stream to Web Stream
function streamToWeb(stream: fs.ReadStream): ReadableStream {
    return new ReadableStream({
        start(controller) {
            stream.on('data', (chunk) => controller.enqueue(chunk));
            stream.on('end', () => controller.close());
            stream.on('error', (err) => controller.error(err));
        },
    });
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');

  if (!fileName) {
    return new NextResponse('Bad Request: Missing file parameter', { status: 400 });
  }

  // Security: Sanitize filename to prevent path traversal
  const sanitizedFileName = path.basename(fileName);
  if (sanitizedFileName !== fileName) {
      return new NextResponse('Bad Request: Invalid file name', { status: 400 });
  }
  
  const filePath = path.join(os.tmpdir(), sanitizedFileName);

  try {
    const stats = await stat(filePath);
    const stream = fs.createReadStream(filePath);

    const webStream = streamToWeb(stream);

    // After the response is fully sent, clean up the file.
    stream.on('close', () => {
        console.log(`Download complete for ${filePath}. Deleting temporary file.`);
        fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting temp file ${filePath}:`, err);
        });
    });

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${sanitizedFileName}"`,
        'Content-Type': 'application/zip',
        'Content-Length': stats.size.toString(),
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new NextResponse('File not found', { status: 404 });
    }
    console.error('Error serving export file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
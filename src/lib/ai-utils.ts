import 'server-only';
import mime from 'mime-types';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';

/**
 * Helper to convert an image path/URI to the format the GoogleGenAI SDK needs.
 * Supports base64 data URIs and local server paths (starting with /).
 */
export async function imageToGenerativePart(imageDataUriOrUrl: string) {
  let dataUri = imageDataUriOrUrl;
  
  if (dataUri.startsWith('/')) {
    const buffer = await getBufferFromLocalPath(dataUri);
    const mimeType = mime.lookup(dataUri) || 'image/png';
    dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
  
  const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URI');

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

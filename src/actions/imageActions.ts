'use server';

import { saveFileFromBuffer } from '@/services/storage.service';
import sharp, { type Region } from 'sharp';
import type { PixelCrop } from '@/lib/types';
import path from 'path';
import crypto from 'crypto';
import mime from 'mime-types';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';
import { getHistoryItem } from './historyActions';

const MAX_DIMENSION = 2048;

type PrepareImageResult = {
  success: true;
  imageUrl: string; // e.g., /uploads/user_uploaded_clothing/user_upload_..._.png
  hash: string;
  originalWidth: number;
  originalHeight: number;
  resized: boolean;
} | {
  success: false;
  error: string;
}

/**
 * Handles the initial upload, processing, and server-side storage of a user's image.
 * This action is the new, efficient entry point for all image uploads.
 * @param formData The form data containing the image file under the key 'file'.
 * @returns An object with the server-relative URL of the processed image or an error.
 */
export async function prepareInitialImage(formData: FormData): Promise<PrepareImageResult> {
  const file = formData.get('file') as File | null;
  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer);

    // Create a sharp instance and apply auto-orientation based on EXIF data.
    // This normalizes the image before any other processing.
    const image = sharp(buffer).autoOrient();

    // Get metadata *after* orientation has been applied to get correct dimensions.
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return { success: false, error: 'Could not read image metadata.' };
    }

    let processingPipeline = image;
    let resized = false;

    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      processingPipeline = processingPipeline
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        });
      resized = true;
    }

    // Convert to PNG and get the final buffer from the pipeline
    const outputBuffer = await processingPipeline.png().toBuffer();

    // Use the storage service to save the processed buffer and get a URL
    const { relativeUrl, hash } = await saveFileFromBuffer(
      outputBuffer,
      'user_upload',
      'user_uploaded_clothing',
      'png'
    );

    return {
      success: true,
      imageUrl: relativeUrl,
      hash,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      resized,
    };
  } catch (error) {
    console.error('Error preparing image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to process image: ${errorMessage}` };
  }
}

/**
 * Crops an existing image on the server.
 * @param imageUrl The server-relative URL of the image to crop.
 * @param crop The pixel crop data.
 * @returns An object with the server-relative URL of the cropped image or an error.
 */
export async function cropImage(
  imageUrl: string,
  crop: PixelCrop
): Promise<PrepareImageResult | { success: false; error: string }> {
  if (!imageUrl || !crop) {
    return { success: false, error: 'Image URL and crop data are required.' };
  }

  try {
    // Use secure file system utility for reading the image
    const originalBuffer = await getBufferFromLocalPath(imageUrl);
    
    const originalImage = sharp(originalBuffer);
    const metadata = await originalImage.metadata();

    if (!metadata.width || !metadata.height) {
      return { success: false, error: 'Could not read source image metadata for cropping.' };
    }

    const cropRegion: Region = {
      left: Math.round(crop.x),
      top: Math.round(crop.y),
      width: Math.round(crop.width),
      height: Math.round(crop.height),
    };

    // Ensure crop dimensions are within image bounds
    if (
      cropRegion.left < 0 ||
      cropRegion.top < 0 ||
      cropRegion.left + cropRegion.width > metadata.width ||
      cropRegion.top + cropRegion.height > metadata.height
    ) {
      return { success: false, error: 'Crop dimensions are out of bounds.' };
    }

    // Save cropped image as PNG for consistency and Next.js Image Optimizer compatibility
    const croppedBuffer = await originalImage.extract(cropRegion).png().toBuffer();

    const { relativeUrl, hash } = await saveFileFromBuffer(
      croppedBuffer,
      'cropped',
      'processed_images',
      'png'
    );

    return {
      success: true,
      imageUrl: relativeUrl,
      hash,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
      resized: false, // This wasn't a resize operation
    };
  } catch (error) {
    console.error('Error cropping image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to crop image: ${errorMessage}` };
  }
}

/**
 * Fetches an image from a public URL on the server-side to bypass client-side CORS issues.
 * @param imageUrl The public URL of the image to fetch.
 * @returns An object containing the image as a data URI and a generated hash.
 */
export async function fetchImageAndConvertToDataUri(
  imageUrl: string
): Promise<{ success: true; dataUri: string; hash: string } | { success: false; error: string }> {
  try {
    // If this looks like a server-relative uploads path, read from disk directly.
    // Supports:
    //   - /uploads/...
    //   - /api/images/...
    const uploadsPrefix = '/uploads/';
    const apiImagesPrefix = '/api/images/';

    // If it's a local path, use our canonical utility.
    if (imageUrl.startsWith(uploadsPrefix) || imageUrl.startsWith(apiImagesPrefix)) {
      // Map /api/images/... -> /uploads/...
      const uploadsPath = imageUrl.startsWith(apiImagesPrefix)
        ? imageUrl.replace(new RegExp(`^${apiImagesPrefix}`), uploadsPrefix)
        : imageUrl;
      
      const buffer = await getBufferFromLocalPath(uploadsPath);
      const contentType = mime.lookup(uploadsPath) || 'application/octet-stream';
      if (!contentType.startsWith('image/')) {
        throw new Error('Local file is not an image.');
      }
      const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      return { success: true, dataUri, hash };
    }

    // Fallback: remote URL — perform network fetch.
    const response = await fetch(imageUrl, {
      cache: 'force-cache',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
    if (!contentType.startsWith('image/')) {
      throw new Error('Fetched content is not a valid image type.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return { success: true, dataUri, hash };
  } catch (error) {
    console.error(`Error fetching image from URL on server: ${imageUrl}`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error during image fetch.';
    return { success: false, error: errorMessage };
  }
}

type RecreateStateResult = {
  success: true;
  imageUrl: string;
  hash: string;
  originalWidth: number;
  originalHeight: number;
} | {
  success: false;
  error: string;
}

export async function recreateStateFromHistoryAction(historyItemId: string): Promise<RecreateStateResult> {
  // 1. Get the history item securely.
  //    getHistoryItem already handles user authentication and authorization.
  const item = await getHistoryItem(historyItemId);
  if (!item) {
    return { success: false, error: 'History item not found or you do not have permission.' };
  }

  // 2. Determine the source image URL from the history item
  const sourceImageUrl = item.videoGenerationParams?.sourceImageUrl || item.originalClothingUrl;
  if (!sourceImageUrl) {
    return { success: false, error: 'No source image found in history item.' };
  }

  try {
    // 3. Read the image file directly from the server's filesystem
    //    This is the key optimization: NO client-side fetch, NO re-upload.
    const imageBuffer = await getBufferFromLocalPath(sourceImageUrl);

    // 4. Get image metadata using sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height) {
      return { success: false, error: 'Could not read image metadata.' };
    }

    // 5. Calculate the hash of the existing file
    const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');

    // 6. Return the necessary state for the client context
    //    We return the *existing* image URL, not a new one.
    return {
      success: true,
      imageUrl: sourceImageUrl,
      hash,
      originalWidth: metadata.width,
      originalHeight: metadata.height,
    };
  } catch (error) {
    console.error('Error recreating state from history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to process history image: ${errorMessage}` };
  }
}

/**
 * Rotates an existing image on the server by a specified angle.
 * @param imageUrl The server-relative URL of the image to rotate.
 * @param angle The angle of rotation (-90 for left, 90 for right).
 * @returns An object with the new URL, hash, and dimensions of the rotated image.
 */
export async function rotateImage(
  imageUrl: string,
  angle: number
): Promise<PrepareImageResult | { success: false; error: string }> {
  if (!imageUrl || (angle !== 90 && angle !== -90)) {
    return { success: false, error: 'Image URL and a valid angle (90 or -90) are required.' };
  }

  try {
    // Use secure file system utility for reading the image
    const originalBuffer = await getBufferFromLocalPath(imageUrl);

    // Perform rotation and convert to a new PNG buffer
    const rotatedBuffer = await sharp(originalBuffer)
      .rotate(angle)
      .png()
      .toBuffer();

    // Get the new dimensions after rotation
    const newMetadata = await sharp(rotatedBuffer).metadata();
    if (!newMetadata.width || !newMetadata.height) {
      return { success: false, error: 'Could not read metadata of the rotated image.' };
    }

    // Save the new buffer to a file
    const { relativeUrl, hash } = await saveFileFromBuffer(
      rotatedBuffer,
      'rotated',
      'processed_images',
      'png'
    );

    return {
      success: true,
      imageUrl: relativeUrl,
      hash,
      // Return the new dimensions so the client context can update its state
      originalWidth: newMetadata.width,
      originalHeight: newMetadata.height,
      resized: false, // This wasn't a resize operation
    };
  } catch (error) {
    console.error('Error rotating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to rotate image: ${errorMessage}` };
  }
}
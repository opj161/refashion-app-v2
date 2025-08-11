'use server';

import { saveFileFromBuffer } from '@/services/storage.service';
import sharp, { type Region } from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const MAX_DIMENSION = 2048;

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return { success: false, error: 'Could not read image metadata.' };
    }

    let finalBuffer = buffer;
    let resized = false;

    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      finalBuffer = Buffer.from(await image
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer());
      resized = true;
    }

    // Save as PNG instead of lossless WEBP for Next.js Image Optimizer compatibility
    const outputBuffer = await sharp(finalBuffer).png().toBuffer();

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
 * @param scaledPixelCrop The pixel crop data with coordinates already scaled to the original image dimensions.
 * @returns An object with the server-relative URL of the cropped image or an error.
 */
export async function cropImage(
  imageUrl: string,
  scaledPixelCrop: PixelCrop
): Promise<PrepareImageResult | { success: false; error: string }> {
  if (!imageUrl || !scaledPixelCrop) {
    return { success: false, error: 'Image URL and crop data are required.' };
  }

  try {
    // FIX: The imageUrl is already the correct relative path from the project root (e.g., /uploads/...).
    // We no longer need to add the 'public' directory segment.
    const imagePath = path.join(process.cwd(), imageUrl);
    const originalBuffer = await fs.readFile(imagePath);
    
    const originalImage = sharp(originalBuffer);
    const metadata = await originalImage.metadata();

    if (!metadata.width || !metadata.height) {
      return { success: false, error: 'Could not read source image metadata for cropping.' };
    }

    const cropRegion: Region = {
      left: Math.round(scaledPixelCrop.x),
      top: Math.round(scaledPixelCrop.y),
      width: Math.round(scaledPixelCrop.width),
      height: Math.round(scaledPixelCrop.height),
    };

    // SERVER-SIDE VALIDATION (Increased Robustness)
    // This check ensures the client-calculated crop is valid for the original image dimensions.
    if (
      cropRegion.left < 0 ||
      cropRegion.top < 0 ||
      cropRegion.left + cropRegion.width > metadata.width ||
      cropRegion.top + cropRegion.height > metadata.height
    ) {
      console.error("Invalid crop dimensions received:", { cropRegion, metadata });
      return { success: false, error: 'Crop dimensions are out of bounds of the original image.' };
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
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15000), 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('Fetched content is not a valid image type.');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

    const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');

    return { success: true, dataUri, hash };

  } catch (error) {
    console.error(`Error fetching image from URL on server: ${imageUrl}`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error during image fetch.';
    return { success: false, error: errorMessage };
  }
}
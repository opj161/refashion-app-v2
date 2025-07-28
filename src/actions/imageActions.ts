'use server';

import { saveFileFromBuffer } from '@/services/storage.service';
import sharp, { type Region } from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const MAX_DIMENSION = 2048;

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

type PrepareImageResult = {
  success: true;
  imageUrl: string; // e.g., /uploads/user_uploaded_clothing/user_upload_..._webp
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
    let finalFormat: keyof sharp.FormatEnum = metadata.format === 'gif' ? 'gif' : 'webp';

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

    // Convert to a modern format for optimization, unless it's a gif
    if (finalFormat === 'webp') {
        // --- CHANGE FOR LOSSLESS ---
        // Use lossless compression to preserve maximum image quality for AI processing.
        // The `quality` setting is ignored when `lossless` is true.
        finalBuffer = Buffer.from(await sharp(finalBuffer).webp({ lossless: true }).toBuffer());
    }

    // Use the storage service to save the processed buffer and get a URL
    const { relativeUrl, hash } = await saveFileFromBuffer(
      finalBuffer,
      'user_upload',
      'user_uploaded_clothing',
      finalFormat as string
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
    const imagePath = path.join(process.cwd(), 'public', imageUrl);
    const originalBuffer = await fs.readFile(imagePath);
    
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
    if (cropRegion.left + cropRegion.width > metadata.width || cropRegion.top + cropRegion.height > metadata.height) {
      return { success: false, error: 'Crop dimensions are out of bounds.' };
    }

    // --- CHANGE FOR LOSSLESS ---
    // Ensure the cropped image is also saved losslessly to maintain fidelity.
    const croppedBuffer = await originalImage.extract(cropRegion).webp({ lossless: true }).toBuffer();

    const { relativeUrl, hash } = await saveFileFromBuffer(
      croppedBuffer,
      'cropped',
      'processed_images',
      'webp'
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
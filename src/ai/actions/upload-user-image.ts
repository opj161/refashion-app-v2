
// This is a server-side file.
'use server';

/**
 * @fileOverview Server action for uploading a user-provided image (clothing item) 
 * locally to the uploads directory.
 *
 * - uploadUserImageAction - A function that handles the image upload and returns its local path.
 */

import { saveDataUriLocally } from '@/services/storage.service';


/**
 * Uploads a user-provided image (as a data URI) and returns its local path.
 * @param imageDataUri The image to upload, as a data URI.
 * @returns Promise<string> The local relative path of the uploaded image.
 */
export async function uploadUserImageAction(imageDataUri: string): Promise<string> {
  if (!imageDataUri) {
    throw new Error('Image data URI is required for upload.');
  }
  try {
    console.log('Using local storage for user image upload.');
    const { relativeUrl } = await saveDataUriLocally(
      imageDataUri,
      'RefashionAI_userclothing',
      'user_uploaded_clothing'
    );
    return relativeUrl;
  } catch (uploadError) {
    console.error('Error saving user image to local storage:', uploadError);
    throw new Error(`Failed to save user image: ${(uploadError as Error).message}`);
  }
}

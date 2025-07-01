
// This is a server-side file.
'use server';

/**
 * @fileOverview Server action for uploading a user-provided image (clothing item) 
 * locally to the uploads directory.
 *
 * - uploadUserImageAction - A function that handles the image upload and returns its local path.
 */

import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import fs from 'fs';
import path from 'path';

// Helper function to save image data URI locally
async function saveImageLocally(imageDataUri: string, fileNamePrefix: string, subfolder: string): Promise<string> {
  const match = imageDataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URI format for local save.');
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] || 'png';

  const uniqueFileName = `${fileNamePrefix}_${uuidv4()}.${extension}`;
  
  // process.cwd() gives the root of the project
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', subfolder);

  // Ensure the directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, uniqueFileName);
    // Write the file with proper permissions
  fs.writeFileSync(filePath, buffer, { mode: 0o777 });
  
  // Ensure the file has proper permissions (readable by web server)
  try {
    fs.chmodSync(filePath, 0o777); // rwxrwxrwx
    console.log(`Set file permissions to 777 for: ${filePath}`);
  } catch (chmodError) {
    console.warn(`Warning: Could not set file permissions for ${filePath}:`, chmodError);
  }

  // Return a URL relative to the public folder
  const relativeUrl = `/uploads/${subfolder}/${uniqueFileName}`;
  console.log(`User image saved locally to: ${filePath}, accessible at: ${relativeUrl}`);
  return relativeUrl;
}


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
    return await saveImageLocally(imageDataUri, 'RefashionAI_userclothing', 'user_uploaded_clothing');
  } catch (uploadError) {
    console.error('Error saving user image to local storage:', uploadError);
    throw new Error(`Failed to save user image: ${(uploadError as Error).message}`);
  }
}

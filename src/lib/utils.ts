import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a URL that the client can use to display an image.
 * This function now transparently proxies local file paths through a dedicated API route.
 * @param originalPath - The internal storage path, e.g., '/uploads/generated_images/image.png'
 * @returns A publicly accessible URL for the image.
 */
export function getDisplayableImageUrl(originalPath: string | null): string | null {
  if (!originalPath) return null;

  if (originalPath.startsWith("data:")) {
    return originalPath;
  }
  
  // For local files, point to the new dynamic image serving API route
  if (originalPath.startsWith("/uploads/")) {
    return `/api/images${originalPath.slice('/uploads'.length)}`;
  }

  return originalPath; // Return other paths (like external Fal URLs) as is.
}

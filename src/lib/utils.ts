import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns displayable image URLs for serving static files directly from Next.js
 * Serves images directly from the /public directory using Next.js's optimized static file server
 * @param originalPath - The original path like '/uploads/generated_images/image.png'
 * @returns The direct path for Next.js static file serving
 */
export function getDisplayableImageUrl(originalPath: string | null): string | null {
  if (!originalPath) return null;

  // Handle data URIs (base64 images) - return as-is
  if (originalPath.startsWith("data:")) {
    return originalPath;
  }

  // Return the original path directly - Next.js will serve files from /public directory
  // Files in /public/uploads/... are accessible at /uploads/... URLs
  return originalPath;
}

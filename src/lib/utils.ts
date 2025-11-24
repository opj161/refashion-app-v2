import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a URL that the client can use to display an image.
 * 
 * REFACTOR: Now returns the direct /uploads/ path.
 * The rewrite rule in next.config.ts handles mapping /uploads/* to /api/images/*.
 * This decouples the frontend from the specific API implementation.
 */
export function getDisplayableImageUrl(originalPath: string | null): string | null {
  if (!originalPath) return null;

  if (originalPath.startsWith("data:")) {
    return originalPath;
  }
  
  // If it's a remote URL (e.g. Fal.ai result not yet downloaded), return as is
  if (originalPath.startsWith("http")) {
    return originalPath;
  }

  // Return local paths as-is. Next.js rewrites will handle the routing.
  if (originalPath.startsWith("/uploads/")) {
    return originalPath;
  }

  return originalPath;
}

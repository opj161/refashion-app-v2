import { useState, useEffect } from 'react';

interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface UseImageLoaderResult {
  isLoading: boolean;
  dimensions: ImageDimensions | null;
  error: string | null;
}

export function useImageLoader(leftUrl: string | null, rightUrl: string | null): UseImageLoaderResult {
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state when URLs are cleared
    if (!leftUrl || !rightUrl) {
      setIsLoading(false);
      setDimensions(null);
      setError(null);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
      });

    // Load both images concurrently
    Promise.all([loadImage(leftUrl), loadImage(rightUrl)])
      .then(([leftImg, rightImg]) => {
        if (!isCancelled) {
          // Use dimensions from the "before" image (left) as the reference
          const { naturalWidth: width, naturalHeight: height } = leftImg;
          setDimensions({ width, height, aspectRatio: width / height });
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message);
          setIsLoading(false);
          setDimensions(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [leftUrl, rightUrl]); // Re-run effect only when URLs change

  return { isLoading, dimensions, error };
}

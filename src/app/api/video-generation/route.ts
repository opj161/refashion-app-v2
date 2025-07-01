import { NextRequest, NextResponse } from 'next/server';
import { generateVideoAction, GenerateVideoInput, isFalVideoGenerationAvailable } from '@/ai/actions/generate-video';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageUrl,
      prompt,
      resolution,
      duration,
      seed,
      camera_fixed
    } = body;

    // Validate required fields
    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { success: false, error: 'Image URL (from Fal Storage) and prompt are required.' },
        { status: 400 }
      );
    }

    // Check if Fal.ai service is available (implicitly checks for FAL_KEY)
    // This check is also inside generateVideoAction, but good for an early exit.
    if (!await isFalVideoGenerationAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Video generation service is not configured (FAL_KEY missing).' },
        { status: 503 } // Service Unavailable
      );
    }

    // Prepare the input for generateVideoAction
    // The imageUrl is now expected to be a Fal.ai public URL
    const videoInput: GenerateVideoInput = {
      prompt: prompt,
      image_url: imageUrl, // This should be the Fal.ai URL from the client
      resolution: resolution || '720p',
      duration: duration?.toString() || '5',
      camera_fixed: typeof camera_fixed === 'boolean' ? camera_fixed : false,
      seed: (typeof seed === 'number' && !isNaN(seed)) ? seed : -1,
    };

    console.log('Calling generateVideoAction with input:', {
        prompt: videoInput.prompt,
        resolution: videoInput.resolution,
        duration: videoInput.duration,
        camera_fixed: videoInput.camera_fixed,
        seed: videoInput.seed,
        image_url: videoInput.image_url // Should be a Fal URL
    });

    // Call the centralized generateVideoAction
    const result = await generateVideoAction(videoInput);    if (result.videoUrl) {
      console.log('Video generation successful via generateVideoAction:', result);
      return NextResponse.json({
        success: true,
        videoUrl: result.videoUrl,
        localVideoUrl: result.localVideoUrl,
        seed: result.seedUsed,
      });
    } else {
      console.error('Video generation failed via generateVideoAction:', result);
      // Determine appropriate status code based on the error message if possible
      let statusCode = 500;
      if (result.error) {
        if (result.error.includes('FAL_KEY environment variable is not set')) {
          statusCode = 503; // Service Unavailable
        } else if (result.error.toLowerCase().includes('prompt is required') || result.error.toLowerCase().includes('image url or data uri is required')) {
          statusCode = 400; // Bad Request
        } else if (result.error.toLowerCase().includes('authentication failed') || result.error.toLowerCase().includes('api key')) {
          statusCode = 401; // Unauthorized
        } else if (result.error.toLowerCase().includes('invalid parameters') || result.error.toLowerCase().includes('422')) {
            statusCode = 422; // Unprocessable Entity
        } else if (result.error.toLowerCase().includes('timeout')) {
            statusCode = 408; // Request Timeout
        }
      }
      return NextResponse.json(
        { success: false, error: result.error || 'Video generation failed for an unknown reason.' },
        { status: statusCode }
      );
    }

  } catch (error: any) { // Catch any unexpected errors from the overall POST handler
    console.error('Unhandled error in video generation API route:', error);
    let errorMessage = 'An unexpected internal server error occurred.';
    if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

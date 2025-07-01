'use server';

/**
 * @fileOverview Visionatrix API integration service for image upscaling and Fal.ai API for background removal.
 *
 * This service handles communication with:
 * - Visionatrix API to upscale images.
 * - Fal.ai API to remove backgrounds from clothing images.
 *
 * API Documentation:
 * - Visionatrix: Based on IntegrationsManual.md and openapi.json
 * - Fal.ai: Provided by user
 */

import { Buffer } from 'buffer';
import { fal } from '@fal-ai/client';

// Types for Visionatrix API (used for upscaling)
interface VisionatrixTaskResponse {
  tasks_ids: string[];
}

interface VisionatrixProgressResponse {
  progress: number;
  error: string;
  outputs: VisionatrixOutput[];
}

interface VisionatrixOutput {
  comfy_node_id: string;
}

interface VisionatrixConfig {
  baseUrl: string;
  username: string;
  password: string;
}

/**
 * Get Visionatrix configuration from environment variables
 * @param useFallback Whether to use the fallback URL
 */
function getVisionatrixConfig(useFallback: boolean = false): VisionatrixConfig {
  const primaryUrl = process.env.VISIONATRIX_API_URL || 'http://localhost:8288';
  const fallbackUrl = process.env.VISIONATRIX_API_URL_FALLBACK || 'http://192.168.1.9:8288';
  
  const baseUrl = useFallback ? fallbackUrl : primaryUrl;
  const username = process.env.VISIONATRIX_USERNAME || 'admin';
  const password = process.env.VISIONATRIX_PASSWORD || 'admin';

  return { baseUrl, username, password };
}

/**
 * Create authentication headers for Visionatrix API
 */
function createAuthHeaders(username: string, password: string): Headers {
  const headers = new Headers();
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  headers.set('Authorization', `Basic ${credentials}`);
  return headers;
}

// Background removal specific functions (createBackgroundRemovalTask, and parts of pollTaskProgress/retrieveTaskResult if they were solely for it) are removed.
// pollTaskProgress and retrieveTaskResult are kept if they are generic enough for upscaling or if upscaling has its own versions.
// For this change, we assume pollTaskProgress and retrieveTaskResult were also used by upscaling and are kept.
// If they were exclusively for background removal, they would be removed entirely.

/**
 * Create an upscale task in Visionatrix
 */
async function createUpscaleTask(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const useFallback = process.env.VISIONATRIX_USE_FALLBACK === 'true';
  const config = getVisionatrixConfig(useFallback);

  const upscaleFlowId = process.env.VISIONATRIX_UPSCALE_FLOW_ID || "upscale_default_flow";
  if (upscaleFlowId === "upscale_default_flow") {
    console.warn("Warning: VISIONATRIX_UPSCALE_FLOW_ID environment variable not set. Using default value.");
  }

  // Create form data with the image file
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/png' }); // Assuming PNG, adjust if necessary
  formData.append('input_image', blob, filename);

  // Determine if authentication is needed
  const headers = new Headers();
  if (process.env.VISIONATRIX_MODE === 'SERVER') {
    const authHeaders = createAuthHeaders(config.username, config.password);
    for (const [key, value] of authHeaders.entries()) {
      headers.set(key, value);
    }
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/vapi/tasks/create/${upscaleFlowId}`,
      {
        method: 'PUT',
        headers,
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create upscale task: ${response.status} ${errorText}`);
    }

    const data: VisionatrixTaskResponse = await response.json();

    if (!data.tasks_ids || data.tasks_ids.length === 0) {
      throw new Error('No task ID returned from Visionatrix API for upscale task');
    }

    const taskId = data.tasks_ids[0];
    console.log(`Upscale task created successfully. Task ID: ${taskId}`);
    return taskId;

  } catch (error) {
    console.error('Error creating upscale task:', error);
    throw new Error(`Failed to create upscale task: ${(error as Error).message}`);
  }
}

/**
 * Poll task progress until completion (For Visionatrix tasks like upscaling)
 * @param taskId The task ID to check
 * @returns Promise<VisionatrixOutput[]> The task outputs when completed
 */
async function pollTaskProgress(taskId: string): Promise<VisionatrixOutput[]> {
  const useFallback = process.env.VISIONATRIX_USE_FALLBACK === 'true';
  const config = getVisionatrixConfig(useFallback);
  const authHeaders = createAuthHeaders(config.username, config.password);
  
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(
        `${config.baseUrl}/vapi/tasks/progress/${taskId}`,
        {
          method: 'GET',
          headers: authHeaders,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get task progress: ${response.status}`);
      }

      const progressData: VisionatrixProgressResponse = await response.json();
        console.log(`Task ${taskId} progress: ${progressData.progress}%`);
      
      // Check for errors
      if (progressData.error) {
        throw new Error(`Task ${taskId} encountered an error: ${progressData.error}`);
      }
      
      // Check for completion: progress must be 100% AND outputs must be available
      if (progressData.progress >= 100) {
        if (progressData.outputs && progressData.outputs.length > 0) {
          console.log(`Task ${taskId} completed successfully`);
          return progressData.outputs;
        } else {
          // Progress is 100% but outputs not yet ready - continue polling
          console.log(`Task ${taskId} progress 100% but outputs not ready yet, continuing...`);
        }
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
    } catch (error) {
      console.error(`Error polling task progress (attempt ${attempts + 1}):`, error);
      throw error;
    }
  }
  
  throw new Error(`Task ${taskId} timed out after ${maxAttempts} attempts`);
}

/**
 * Retrieve the result image from a completed Visionatrix task (e.g., upscaling)
 * @param taskId The task ID
 * @param outputs The task outputs
 * @param targetOutputNodeId Optional specific output node ID to retrieve
 * @returns Promise<Buffer> The processed image buffer
 */
async function retrieveTaskResult( // This is specific to Visionatrix
  taskId: string,
  outputs: VisionatrixOutput[],
  targetOutputNodeId?: string
): Promise<Buffer> {
  const useFallback = process.env.VISIONATRIX_USE_FALLBACK === 'true';
  const config = getVisionatrixConfig(useFallback);
  const authHeaders = createAuthHeaders(config.username, config.password);
  
  if (!outputs || outputs.length === 0) {
    throw new Error('No outputs found for completed task');
  }

  let outputToUse: VisionatrixOutput | undefined;

  if (targetOutputNodeId) {
    outputToUse = outputs.find(o => o.comfy_node_id === targetOutputNodeId);
    if (!outputToUse) {
      console.warn(`Warning: Output node ID "${targetOutputNodeId}" not found. Falling back to the first output.`);
    }
  }

  if (!outputToUse) {
    outputToUse = outputs[0]; // Fallback to the first output
  }

  if (!outputToUse || !outputToUse.comfy_node_id) {
    throw new Error('Output node ID not found or output is invalid');
  }

  try {
    const params = new URLSearchParams({
      task_id: taskId,
      node_id: outputToUse.comfy_node_id.toString(),
    });

    const response = await fetch(
      `${config.baseUrl}/vapi/tasks/results?${params}`,
      {
        method: 'GET',
        headers: authHeaders,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to retrieve task result: ${response.status}`);
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer());
    console.log(`Successfully retrieved image for Visionatrix task ${taskId}`);
    return resultBuffer;
    
  } catch (error) {
    console.error('Error retrieving Visionatrix task result:', error);
    throw new Error(`Failed to retrieve Visionatrix task result: ${(error as Error).message}`);
  }
}

/**
 * Main function to remove background from an image using Fal.ai
 * @param imageDataUri The image as a data URI or a public URL
 * @returns Promise an object containing the processed image URL
 */
export async function removeBackgroundFromImage(
  imageDataUri: string
): Promise<{ outputImageUrl: string }> {
  console.log('Starting background removal process with Fal.ai...');

  if (!imageDataUri) {
    throw new Error('Image data URI or URL is required for background removal');
  }

  // FAL_KEY should be set as an environment variable for the @fal-ai/client to pick it up.
  // No need to manually configure fal.config({ credentials: "YOUR_FAL_KEY" }); if FAL_KEY is in env.
  if (!process.env.FAL_KEY) {
     console.warn('FAL_KEY environment variable is not set. Fal.ai API calls will likely fail.');
     // Optionally, throw an error if FAL_KEY is mandatory for the application to function.
     // throw new Error('FAL_KEY environment variable is not set. Background removal cannot proceed.');
  }

  try {
    // Using fal.subscribe as it handles polling and returns the final result.
    // The model identifier is "fal-ai/bria/background/remove"
    const result: any = await fal.subscribe("fal-ai/bria/background/remove", {
      input: {
        image_url: imageDataUri, // Fal.ai client handles data URIs and public URLs.
        // sync_mode can be used if a synchronous result is preferred, but subscribe is generally better.
      },
      logs: process.env.NODE_ENV === 'development', // Enable logs in development for easier debugging
      onQueueUpdate: (update) => {
        // Optional: Log queue updates, e.g., progress
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach(log => console.log(`[Fal.ai Progress]: ${log.message}`));
        }
      },
    });    // According to Fal.ai documentation, the output structure for bria/background/remove is:
    // { "data": { "image": { "url": "...", "content_type": "...", ... } } }
    if (result && result.data && result.data.image && result.data.image.url) {
      console.log('Background removal completed successfully with Fal.ai.');
      return { outputImageUrl: result.data.image.url };
    } else {
      console.error('Fal.ai background removal response did not contain the expected image URL.');
      console.error('Fal.ai raw result:', result); // Log the full result for diagnostics
      throw new Error('Fal.ai background removal failed to return a valid image URL.');
    }  } catch (error) {
    console.error('Error during Fal.ai background removal call:', error);
    // Check if the error is from Fal.ai client or a network issue, etc.
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      console.error('Fal.ai API error details:', error.response.data);
    }
    throw new Error(`Fal.ai background removal failed: ${(error as Error).message}`);
  }
}

/**
 * Main function to upscale an image (using Visionatrix)
 * @param imageDataUri The image as a data URI
 * @returns Promise an object containing the upscaled image as a data URI and the scenario used
 */
export async function upscaleImage(
  imageDataUri: string
): Promise<{ imageDataUri: string; scenarioUsed: 'primary' | 'fallback' }> {
  console.log('Starting image upscale process with Visionatrix...');
  let scenarioUsed: 'primary' | 'fallback' = 'primary';

  // Parse the data URI
  const match = imageDataUri.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data URI format');
  }

  const mimeType = match[1];
  const base64Data = match[2];
  const imageBuffer = Buffer.from(base64Data, 'base64');
  const extension = mimeType.split('/')[1] || 'png'; // Default to png if not specified
  const filename = `input_upscale_image.${extension}`;

  const targetOutputNodeId = process.env.VISIONATRIX_UPSCALE_OUTPUT_NODE_ID || "YOUR_UPSCALE_OUTPUT_NODE_ID_ENV_VAR_NOT_SET";
  if (targetOutputNodeId === "YOUR_UPSCALE_OUTPUT_NODE_ID_ENV_VAR_NOT_SET") {
    console.warn("Warning: VISIONATRIX_UPSCALE_OUTPUT_NODE_ID environment variable not set. Using default placeholder.");
  }

  // First try with primary URL
  try {
    // Step 1: Create the upscale task
    console.log('Creating upscale task...');
    const taskId = await createUpscaleTask(imageBuffer, filename);

    // Step 2: Poll for completion
    console.log('Polling for upscale task completion...');
    const outputs = await pollTaskProgress(taskId);

    // Step 3: Retrieve the result
    console.log('Retrieving upscaled image...');
    const resultBuffer = await retrieveTaskResult(taskId, outputs, targetOutputNodeId);

    // Step 4: Convert back to data URI
    const resultBase64 = resultBuffer.toString('base64');
    const resultDataUri = `data:image/png;base64,${resultBase64}`; // Assuming output is always PNG

    console.log('Image upscaling completed successfully');
    return { imageDataUri: resultDataUri, scenarioUsed };

  } catch (primaryError) {
    console.warn('Primary API endpoint failed for upscaling:', primaryError);
    console.log('Trying fallback API endpoint for upscaling...');
    scenarioUsed = 'fallback';

    // Try with fallback URL
    try {
      process.env.VISIONATRIX_USE_FALLBACK = 'true';

      // Step 1: Create the upscale task (with fallback)
      console.log('Creating upscale task with fallback URL...');
      const taskId = await createUpscaleTask(imageBuffer, filename);

      // Step 2: Poll for completion
      console.log('Polling for upscale task completion with fallback URL...');
      const outputs = await pollTaskProgress(taskId);

      // Step 3: Retrieve the result
      console.log('Retrieving upscaled image with fallback URL...');
      const resultBuffer = await retrieveTaskResult(taskId, outputs, targetOutputNodeId);

      // Step 4: Convert back to data URI
      const resultBase64 = resultBuffer.toString('base64');
      const resultDataUri = `data:image/png;base64,${resultBase64}`;

      console.log('Image upscaling completed successfully with fallback URL');
      return { imageDataUri: resultDataUri, scenarioUsed };

    } catch (fallbackError) {
      console.error('Image upscaling failed with fallback URL:', fallbackError);
      throw new Error(`Image upscaling failed: ${(fallbackError as Error).message}`);
    } finally {
      delete process.env.VISIONATRIX_USE_FALLBACK;
    }
  }
}


/**
 * Check if Visionatrix service is available and configured
 * @returns Promise<boolean> True if service is available
 */
export async function checkVisionatrixAvailability(): Promise<boolean> {
  try {
    // Try with primary URL first
    try {
      const primaryConfig = getVisionatrixConfig(false);
      const primaryAuthHeaders = createAuthHeaders(primaryConfig.username, primaryConfig.password);
      
      // Try to access a basic endpoint to check if service is available
      const primaryResponse = await fetch(`${primaryConfig.baseUrl}/vapi/settings/get_all`, {
        method: 'GET',
        headers: primaryAuthHeaders,
        // Short timeout for availability check
        signal: AbortSignal.timeout(3000),
      });
      
      if (primaryResponse.ok) {
        console.log('Primary Visionatrix API is available');
        return true;
      }
    } catch (primaryError) {
      console.log('Primary Visionatrix API not available, trying fallback...');
    }
    
    // Try fallback URL if primary fails
    const fallbackConfig = getVisionatrixConfig(true);
    const fallbackAuthHeaders = createAuthHeaders(fallbackConfig.username, fallbackConfig.password);
    
    // Try to access a basic endpoint with fallback URL
    const fallbackResponse = await fetch(`${fallbackConfig.baseUrl}/vapi/settings/get_all`, {
      method: 'GET',
      headers: fallbackAuthHeaders,
      // Short timeout for availability check
      signal: AbortSignal.timeout(3000),
    });
    
    if (fallbackResponse.ok) {
      console.log('Fallback Visionatrix API is available');
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('Visionatrix service not available:', (error as Error).message);
    return false;
  }
}

/**
 * Check if Visionatrix upscaling service is available and configured
 * @returns Promise<boolean> True if upscaling service is available
 */
export async function checkUpscalingAvailability(): Promise<boolean> {
  const upscaleFlowId = process.env.VISIONATRIX_UPSCALE_FLOW_ID;
  if (!upscaleFlowId) {
    console.warn('Warning: VISIONATRIX_UPSCALE_FLOW_ID is not set. Upscaling will not be available.');
    return false;
  }

  try {
    // Try with primary URL first
    try {
      const primaryConfig = getVisionatrixConfig(false);
      const primaryAuthHeaders = createAuthHeaders(primaryConfig.username, primaryConfig.password);
      const primaryUrl = `${primaryConfig.baseUrl}/vapi/flows/flow-details?name=${upscaleFlowId}`;

      console.log(`Checking primary upscaling availability: ${primaryUrl}`);
      const primaryResponse = await fetch(primaryUrl, {
        method: 'GET',
        headers: primaryAuthHeaders,
        signal: AbortSignal.timeout(3000), // Short timeout
      });

      if (primaryResponse.ok) {
        console.log('Primary Visionatrix Upscaling API is available.');
        return true;
      }
      console.warn(`Primary upscaling check failed: ${primaryResponse.status}`);
    } catch (primaryError) {
      console.log('Primary Visionatrix Upscaling API not available, trying fallback...');
    }

    // Try fallback URL if primary fails
    const fallbackConfig = getVisionatrixConfig(true);
    const fallbackAuthHeaders = createAuthHeaders(fallbackConfig.username, fallbackConfig.password);
    const fallbackUrl = `${fallbackConfig.baseUrl}/vapi/flows/flow-details?name=${upscaleFlowId}`;

    console.log(`Checking fallback upscaling availability: ${fallbackUrl}`);
    const fallbackResponse = await fetch(fallbackUrl, {
      method: 'GET',
      headers: fallbackAuthHeaders,
      signal: AbortSignal.timeout(3000), // Short timeout
    });

    if (fallbackResponse.ok) {
      console.log('Fallback Visionatrix Upscaling API is available.');
      return true;
    }
    console.warn(`Fallback upscaling check failed: ${fallbackResponse.status}`);
    return false;

  } catch (error) {
    console.warn('Visionatrix upscaling service not available:', (error as Error).message);
    return false;
  }
}

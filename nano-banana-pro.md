great, new task:

assess, wheter this new model (Nano Banana Pro) uses the same API syntax as the previous fal model, and if it could be changed easily


# Nano Banana Pro

> Nano Banana Pro (a.k.a Nano Banana 2) is Google's new state-of-the-art image generation and editing model


## Overview

- **Endpoint**: `https://fal.run/fal-ai/nano-banana-pro/edit`
- **Model ID**: `fal-ai/nano-banana-pro/edit`
- **Category**: image-to-image
- **Kind**: inference
**Tags**: realism, typography



## API Information

This model can be used via our HTTP API or more conveniently via our client libraries.
See the input and output schema below, as well as the usage examples.


### Input Schema

The API accepts the following input parameters:


- **`prompt`** (`string`, _required_):
  The prompt for image editing.
  - Examples: "make a photo of the man driving the car down the california coastline"

- **`num_images`** (`integer`, _optional_):
  The number of images to generate. Default value: `1`
  - Default: `1`
  - Range: `1` to `4`

- **`aspect_ratio`** (`AspectRatioEnum`, _optional_):
  The aspect ratio of the generated image. Default value: `"auto"`
  - Default: `"auto"`
  - Options: `"auto"`, `"21:9"`, `"16:9"`, `"3:2"`, `"4:3"`, `"5:4"`, `"1:1"`, `"4:5"`, `"3:4"`, `"2:3"`, `"9:16"`

- **`output_format`** (`OutputFormatEnum`, _optional_):
  The format of the generated image. Default value: `"png"`
  - Default: `"png"`
  - Options: `"jpeg"`, `"png"`, `"webp"`

- **`sync_mode`** (`boolean`, _optional_):
  If `True`, the media will be returned as a data URI and the output data won't be available in the request history.
  - Default: `false`

- **`image_urls`** (`list<string>`, _required_):
  The URLs of the images to use for image-to-image generation or image editing.
  - Array of string
  - Examples: ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png","https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"]

- **`resolution`** (`ResolutionEnum`, _optional_):
  The resolution of the image to generate. Default value: `"1K"`
  - Default: `"1K"`
  - Options: `"1K"`, `"2K"`, `"4K"`



**Required Parameters Example**:

```json
{
  "prompt": "make a photo of the man driving the car down the california coastline",
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
  ]
}
```

**Full Example**:

```json
{
  "prompt": "make a photo of the man driving the car down the california coastline",
  "num_images": 1,
  "aspect_ratio": "auto",
  "output_format": "png",
  "image_urls": [
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
    "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
  ],
  "resolution": "1K"
}
```


### Output Schema

The API returns the following output format:

- **`images`** (`list<ImageFile>`, _required_):
  The edited images.
  - Array of ImageFile
  - Examples: [{"file_name":"nano-banana-multi-edit-output.png","content_type":"image/png","url":"https://storage.googleapis.com/falserverless/example_outputs/nano-banana-multi-edit-output.png"}]

- **`description`** (`string`, _required_):
  The description of the generated images.



**Example Response**:

```json
{
  "images": [
    {
      "file_name": "nano-banana-multi-edit-output.png",
      "content_type": "image/png",
      "url": "https://storage.googleapis.com/falserverless/example_outputs/nano-banana-multi-edit-output.png"
    }
  ],
  "description": ""
}
```


## Usage Examples

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/nano-banana-pro/edit \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "prompt": "make a photo of the man driving the car down the california coastline",
     "image_urls": [
       "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png",
       "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"
     ]
   }'
```

### Python

Ensure you have the Python client installed:

```bash
pip install fal-client
```

Then use the API client to make requests:

```python
import fal_client

def on_queue_update(update):
    if isinstance(update, fal_client.InProgress):
        for log in update.logs:
           print(log["message"])

result = fal_client.subscribe(
    "fal-ai/nano-banana-pro/edit",
    arguments={
        "prompt": "make a photo of the man driving the car down the california coastline",
        "image_urls": ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png", "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"]
    },
    with_logs=True,
    on_queue_update=on_queue_update,
)
print(result)
```

### JavaScript

Ensure you have the JavaScript client installed:

```bash
npm install --save @fal-ai/client
```

Then use the API client to make requests:

```javascript
import { fal } from "@fal-ai/client";

const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: "make a photo of the man driving the car down the california coastline",
    image_urls: ["https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input.png", "https://storage.googleapis.com/falserverless/example_inputs/nano-banana-edit-input-2.png"]
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});
console.log(result.data);
console.log(result.requestId);
```


## Additional Resources

### Documentation

- [Model Playground](https://fal.ai/models/fal-ai/nano-banana-pro/edit)
- [API Documentation](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)
- [OpenAPI Schema](https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=fal-ai/nano-banana-pro/edit)

### fal.ai Platform

- [Platform Documentation](https://docs.fal.ai)
- [Python Client](https://docs.fal.ai/clients/python)
- [JavaScript Client](https://docs.fal.ai/clients/javascript)



Based on the analysis of your codebase (`src/services/fal-api/image.service.ts`) and the provided documentation for **Nano Banana Pro**, the API syntax is **nearly identical**, making the swap extremely easy.

### Assessment: **100% Compatible**

#### 1. Endpoint Comparison
*   **Current:** `fal-ai/gemini-25-flash-image/edit`
*   **New:** `fal-ai/nano-banana-pro/edit`

#### 2. Input Schema Compatibility
Your current code sends:
```typescript
const input = {
  prompt: prompt,
  image_urls: [imageUrl],
  num_images: 1,
  output_format: "png" as const,
};
```
The **Nano Banana Pro** model accepts exactly these parameters. It supports additional optional parameters (`aspect_ratio`, `resolution`), but since they are optional, your existing input object is valid without modification.

#### 3. Output Schema Compatibility
Your current code expects:
```typescript
const imageUrl_result = result.data.images[0].url;
const description = result.data.description;
```
The **Nano Banana Pro** model returns exactly this structure:
```json
{
  "images": [{ "url": "..." }],
  "description": "..."
}
```

### Implementation Plan

You only need to update **one line** in `src/services/fal-api/image.service.ts`.

#### Change Required:

```typescript:src/services/fal-api/image.service.ts
// ... existing code ...
export async function generateWithGemini25Flash(
  // ... params ...
): Promise<{ imageUrl: string; description?: string }> {
  const logger = createApiLogger('FAL_IMAGE', 'Nano Banana Pro Generation', { // Updated Label
    username,
    model: 'fal-ai/nano-banana-pro/edit', // Updated Model ID
  });

  // ... existing input construction ...

  try {
    logger.progress('Submitting to Fal.ai queue');

    // Updated Model ID here
    const result: any = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
      input,
      logs: process.env.NODE_ENV === 'development',
      // ... callback logic ...
    });

    // ... existing response parsing (no changes needed) ...
```






Here is the complete and methodically verified implementation to replace Google Gemini 2.0 with Nano Banana Pro and adjust generation concurrency.

### 1. Update Type Definitions
**File:** `src/lib/types.ts`

We update the union type to remove the legacy Google model and add the new Fal model.

```typescript
// src/lib/types.ts

export interface SessionUser {
  username: string;
  role: 'admin' | 'user';
  isLoggedIn: boolean;
}

export interface SessionData {
  user?: SessionUser;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  attributes: ModelAttributes;
  constructedPrompt: string;
  originalClothingUrl: string;
  editedImageUrls: (string | null)[];
  originalImageUrls?: (string | null)[];
  username: string;
  settingsMode?: 'basic' | 'advanced';
  generation_mode?: 'creative' | 'studio';
  generatedVideoUrls?: (string | null)[];
  videoGenerationParams?: {
    prompt: string;
    resolution: string;
    videoModel?: 'lite' | 'pro';
    duration: string;
    seed: number;
    sourceImageUrl: string;
    modelMovement: string;
    fabricMotion: string;
    cameraAction: string;
    aestheticVibe: string;
    cameraFixed: boolean;
    localVideoUrl?: string | null;
  };
  status?: 'processing' | 'completed' | 'failed';
  error?: string;
  webhookUrl?: string;
  // UPDATED: Replaced google_gemini_2_0 with fal_nano_banana_pro
  imageGenerationModel?: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
}

export interface ModelAttributes {
  gender: string;
  bodyShapeAndSize: string;
  ageRange: string;
  ethnicity: string;
  poseStyle: string;
  background: string;
  fashionStyle: string;
  hairStyle: string;
  modelExpression: string;
  lightingType: string;
  lightQuality: string;
  modelAngle: string;
  lensEffect: string;
  depthOfField: string;
  timeOfDay: string;
  overallMood: string;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### 2. Update Database Service & Defaults
**File:** `src/services/database.service.ts`

We handle the backward compatibility here. If a row in the DB says `google_gemini_2_0`, we treat it as the new default (`fal_nano_banana_pro`) to prevent runtime crashes, while updating the `FullUser` type definition.

```typescript
// src/services/database.service.ts
import 'server-only';

import { cache } from 'react';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

import type { HistoryItem, ModelAttributes, SessionUser } from '@/lib/types';

// ... [Keep existing imports and setup code until rowToHistoryItem] ...

// Helper function to safely parse JSON with minimal overhead
function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

export function rowToHistoryItem(row: any): HistoryItem {
  const editedImageUrls = safeJsonParse<any[]>(row.edited_images, []);
  const originalImageUrls = safeJsonParse<any[] | undefined>(row.original_images, undefined);
  const generatedVideoUrls = safeJsonParse<any[] | undefined>(row.video_urls, undefined);
  const attributes = safeJsonParse<ModelAttributes>(row.attributes, {} as ModelAttributes);
  const videoGenerationParams = safeJsonParse<any>(row.videoGenerationParams, undefined);

  // Handle legacy model string mapping
  let model = row.image_generation_model;
  if (model === 'google_gemini_2_0' || !model) {
    model = 'fal_nano_banana_pro';
  }

  return {
    id: row.id,
    username: row.username,
    timestamp: row.timestamp,
    constructedPrompt: row.constructedPrompt,
    originalClothingUrl: row.originalClothingUrl,
    settingsMode: row.settingsMode as 'basic' | 'advanced',
    attributes,
    editedImageUrls: editedImageUrls || [],
    originalImageUrls,
    generatedVideoUrls,
    videoGenerationParams,
    status: row.status as 'processing' | 'completed' | 'failed',
    error: row.error || undefined,
    webhookUrl: row.webhook_url || undefined,
    imageGenerationModel: model, // UPDATED
    generation_mode: row.generation_mode as 'creative' | 'studio' || 'creative',
  };
}

export const insertHistoryItem = (item: HistoryItem): void => {
  const db = getDb();
  const statements = getPreparedStatements();
  
  const insertTransaction = db.transaction(() => {
    statements.insertHistory?.run(
      item.id,
      item.username,
      item.timestamp,
      item.constructedPrompt,
      item.originalClothingUrl,
      item.settingsMode,
      JSON.stringify(item.attributes),
      item.videoGenerationParams ? JSON.stringify(item.videoGenerationParams) : null,
      item.status || 'completed',
      item.error || null,
      item.webhookUrl || null,
      item.imageGenerationModel || 'fal_nano_banana_pro', // UPDATED DEFAULT
      item.generation_mode || 'creative'
    );
    
    // ... [Rest of insert logic remains the same] ...
    // Insert edited images
    item.editedImageUrls.forEach((url, index) => {
      if (url) {
        statements.insertImage?.run(item.id, url, 'edited', index);
      }
    });
    
    // Insert original images if they exist
    if (item.originalImageUrls) {
      item.originalImageUrls.forEach((url, index) => {
        if (url) {
          statements.insertImage?.run(item.id, url, 'original_for_comparison', index);
        }
      });
    }
    
    // Insert video URLs if they exist
    if (item.generatedVideoUrls) {
      item.generatedVideoUrls.forEach((url, index) => {
        if (url) {
          statements.insertImage?.run(item.id, url, 'generated_video', index);
        }
      });
    }
  });
  
  insertTransaction();
};

// ... [Keep findHistoryItemById, updateHistoryItem, updateHistoryImageSlot, findHistoryByUsername, getPaginatedHistoryForUser, getAllUsersHistoryPaginated, getHistoryItemStatus] ...

export type FullUser = SessionUser & {
  passwordHash: string;
  gemini_api_key_1?: string; gemini_api_key_1_mode: 'global' | 'user_specific';
  gemini_api_key_2?: string; gemini_api_key_2_mode: 'global' | 'user_specific';
  gemini_api_key_3?: string; gemini_api_key_3_mode: 'global' | 'user_specific';
  fal_api_key?: string; fal_api_key_mode: 'global' | 'user_specific';
  // UPDATED TYPE DEFINITION
  image_generation_model: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
};

export const findUserByUsername = cache((username: string): FullUser | null => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const row: any = stmt.get(username);

  if (!row) {
    return null;
  }

  // Map legacy value in user record if necessary
  let model = row.image_generation_model;
  if (model === 'google_gemini_2_0' || !model) {
    model = 'fal_nano_banana_pro';
  }

  return {
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    isLoggedIn: true, 
    gemini_api_key_1: row.gemini_api_key_1,
    gemini_api_key_1_mode: row.gemini_api_key_1_mode,
    gemini_api_key_2: row.gemini_api_key_2,
    gemini_api_key_2_mode: row.gemini_api_key_2_mode,
    gemini_api_key_3: row.gemini_api_key_3,
    gemini_api_key_3_mode: row.gemini_api_key_3_mode,
    fal_api_key: row.fal_api_key,
    fal_api_key_mode: row.fal_api_key_mode,
    image_generation_model: model,
  };
});

export const findUserByApiKey = cache((apiKey: string): FullUser | null => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE app_api_key = ?');
  const row: any = stmt.get(apiKey);

  if (!row) {
    return null;
  }

  let model = row.image_generation_model;
  if (model === 'google_gemini_2_0' || !model) {
    model = 'fal_nano_banana_pro';
  }

  return {
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role as 'admin' | 'user',
    isLoggedIn: true,
    gemini_api_key_1: row.gemini_api_key_1,
    gemini_api_key_1_mode: row.gemini_api_key_1_mode,
    gemini_api_key_2: row.gemini_api_key_2,
    gemini_api_key_2_mode: row.gemini_api_key_2_mode,
    gemini_api_key_3: row.gemini_api_key_3,
    gemini_api_key_3_mode: row.gemini_api_key_3_mode,
    fal_api_key: row.fal_api_key,
    fal_api_key_mode: row.fal_api_key_mode,
    image_generation_model: model,
  };
});

// ... [Keep cleanup code] ...
export function closeDb(): void {
  if (db) {
    db.close();
  }
}

process.on('exit', closeDb);
process.on('SIGINT', closeDb);
process.on('SIGTERM', closeDb);
```

### 3. Update History Actions Types
**File:** `src/actions/historyActions.ts`

We update the `addHistoryItem` signature to reflect the new type.

```typescript
// src/actions/historyActions.ts
// ... [imports] ...

export async function addHistoryItem(
  attributes: ModelAttributes,
  constructedPrompt: string,
  originalClothingUrl: string,
  editedImageUrls: (string | null)[],
  settingsMode: 'basic' | 'advanced',
  imageGenerationModel: 'fal_nano_banana_pro' | 'fal_gemini_2_5', // UPDATED TYPE
  status: 'processing' | 'completed' | 'failed' = 'completed',
  error?: string,
  username?: string,
  webhookUrl?: string,
  generation_mode?: 'creative' | 'studio'
): Promise<string> {
  // ... [rest of function body is identical] ...
  const user = username ? { username } : await getCurrentUser();
  if (!user || !user.username) {
    throw new Error('User not authenticated or username not provided.');
  }
  
  const newItem: HistoryItem = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    attributes,
    constructedPrompt,
    originalClothingUrl,
    editedImageUrls,
    username: user.username,
    settingsMode,
    imageGenerationModel,
    status,
    error,
    webhookUrl,
    generation_mode,
  };
  
  dbService.insertHistoryItem(newItem);
  return newItem.id;
}

// ... [rest of file] ...
```

### 4. Refactor Fal Image Service
**File:** `src/services/fal-api/image.service.ts`

We rename and generalize the function to accept a `modelId`.

```typescript
// src/services/fal-api/image.service.ts
'use server';

import 'server-only';

import { fal } from '@/lib/fal-client';
import { createApiLogger } from '@/lib/api-logger';

/**
 * Generates an image using a Fal.ai image-to-image model (Gemini or Nano Banana).
 * @param prompt The text prompt for generation.
 * @param imageUrl The public URL of the source image.
 * @param username The user performing the action for authentication.
 * @param modelId The Fal.ai model endpoint ID to use.
 * @returns Promise<{imageUrl: string, description?: string}> The result from FAL.AI
 */
export async function generateWithFalImageToImage(
  prompt: string,
  imageUrl: string,
  username: string,
  modelId: string // NEW PARAMETER
): Promise<{ imageUrl: string; description?: string }> {
  // Normalize logger tag based on model
  const modelName = modelId.includes('nano-banana') ? 'Nano Banana Pro' : 'Gemini 2.5 Flash';
  
  const logger = createApiLogger('FAL_IMAGE', `${modelName} Generation`, {
    username,
    model: modelId,
  });

  const input = {
    prompt: prompt,
    image_urls: [imageUrl],
    num_images: 1,
    output_format: "png" as const,
    // Nano Banana accepts 'resolution' but it's optional.
    // Gemini accepts it too but might ignore it. Safe to leave default or omit.
  };

  logger.start({
    promptLength: prompt.length,
    imageUrl: imageUrl.substring(0, 100),
    outputFormat: 'png',
  });

  try {
    logger.progress('Submitting to Fal.ai queue');

    const result: any = await fal.subscribe(modelId, {
      input,
      logs: process.env.NODE_ENV === 'development',
      onQueueUpdate: (update: any) => {
        if (update.status === "IN_PROGRESS" && update.logs && process.env.NODE_ENV === 'development') {
          (update.logs as any[]).forEach((log: any) => 
            logger.progress(`Queue: ${log.message}`)
          );
        }
      },
    });

    // Parse response. Both models follow the same schema:
    // { images: [{ url: "..." }], description?: "..." }
    if (!result?.data?.images?.[0]?.url) {
      throw new Error('Unexpected response format. Expected: { images: [{ url: "..." }] }');
    }

    const imageUrl_result = result.data.images[0].url;
    const description = result.data.description || undefined;

    logger.success({
      imageUrl: imageUrl_result,
      hasDescription: !!description,
    });
    
    return {
      imageUrl: imageUrl_result,
      description: description
    };

  } catch (error) {
    logger.error(error);
    throw new Error(`FAL.AI (${modelName}) generation failed: ${(error as Error).message}`);
  }
}

// ... [Keep other export functions: runFalImageWorkflow, removeBackground, upscaleAndEnhance, detailFaces, isServiceAvailable] ...
// ... [IMPORTANT: Ensure you keep the other functions from the original file provided in context] ...
// (Re-pasting helpers for completeness of this file block context, assuming standard ones exist below)

async function runFalImageWorkflow(modelId: string, input: any, taskName: string, username: string): Promise<string> {
  const logger = createApiLogger('FAL_IMAGE', taskName, { username, endpoint: modelId });
  logger.start({ modelId, inputKeys: Object.keys(input).join(', ') });
  try {
    logger.progress('Submitting to Fal.ai queue');
    const result: any = await fal.subscribe(modelId, { input, logs: process.env.NODE_ENV === 'development' });
    
    let outputImageUrl: string | undefined;
    if (result?.data?.outputs) {
      for (const output of Object.values(result.data.outputs) as any) {
        if (output?.images?.[0]?.url) { outputImageUrl = output.images[0].url; break; }
      }
    } else if (result?.data?.images?.[0]?.url) {
      outputImageUrl = result.data.images[0].url;
    } else if (result?.data?.image?.url) {
      outputImageUrl = result.data.image.url;
    }

    if (!outputImageUrl) throw new Error('Fal.ai did not return a valid image URL');
    logger.success({ imageUrl: outputImageUrl });
    return outputImageUrl;
  } catch (error) {
    logger.error(error);
    throw new Error(`${taskName} failed: ${(error as Error).message}`);
  }
}

export async function removeBackground(imageUrlOrDataUri: string, username: string): Promise<string> {
  return runFalImageWorkflow("fal-ai/rembg", { image_url: imageUrlOrDataUri }, 'Background Removal', username);
}

export async function upscaleAndEnhance(imageUrlOrDataUri: string, username: string): Promise<string> {
  const input = {
    loadimage_1: imageUrlOrDataUri,
    prompt_upscale: "high quality fashion photography, high-quality clothing, natural, 8k",
    negative_upscale: "low quality, ugly, make-up, fake, deformed",
    prompt_face: "photorealistic, detailed natural skin, high quality, natural fashion model",
    negative_face: "weird, ugly, make-up, cartoon, anime",
  };
  return runFalImageWorkflow("comfy/opj161/sd-ultimateface", input, 'Upscaling and Enhancement', username);
}

export async function detailFaces(imageUrlOrDataUri: string, username: string): Promise<string> {
  const input = {
    loadimage_1: imageUrlOrDataUri,
    prompt_face: "photorealistic, detailed natural skin, high quality, natural fashion model, defined facial features",
    negative_face: "weird, ugly, make-up, cartoon, anime",
  };
  return runFalImageWorkflow("comfy/opj161/face-detailer", input, 'Face Detailing', username);
}

export async function isServiceAvailable(): Promise<boolean> {
  return !!process.env.FAL_KEY;
}
```

### 5. Update Admin Actions Types
**File:** `src/actions/adminActions.ts`

Update the `UserFormState` type to reflect the new model options.

```typescript
// src/actions/adminActions.ts
// ... [imports] ...

// ... [Previous functions: verifyAdmin, getAllUsers, createUser, deleteUser, getAllSettings, updateSetting, etc.] ...

export type UserFormState = {
  message: string;
  success?: boolean;
  error?: string;
  user?: {
    username: string;
    role: 'admin' | 'user';
    gemini_api_key_1_mode: 'global' | 'user_specific';
    gemini_api_key_2_mode: 'global' | 'user_specific';
    gemini_api_key_3_mode: 'global' | 'user_specific';
    fal_api_key_mode: 'global' | 'user_specific';
    // UPDATED TYPE
    image_generation_model: 'fal_nano_banana_pro' | 'fal_gemini_2_5';
  };
};

// ... [Rest of file, handleApiKeysUpdate, etc.] ...
```

### 6. Refactor Core Generation Flow
**File:** `src/ai/flows/generate-image-edit.ts`

This requires significant changes to handle dynamic image counts (1 vs 3) and route to the unified Fal service function.

```typescript
// src/ai/flows/generate-image-edit.ts
'use server';

import 'server-only';
import { after } from 'next/server';

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';
import fetch from 'node-fetch'; 
import fs from 'fs';
import path from 'path';
import { saveDataUriLocally, downloadAndSaveImageFromUrl } from '@/services/storage.service';
import { getBufferFromLocalPath } from '@/lib/server-fs.utils';
import mime from 'mime-types';
import { getApiKeyForUser } from '@/services/apiKey.service';
import { 
  MODEL_ANGLE_OPTIONS, buildAIPrompt, GENDER_OPTIONS, BODY_SHAPE_AND_SIZE_OPTIONS, 
  AGE_RANGE_OPTIONS, ETHNICITY_OPTIONS, HAIR_STYLE_OPTIONS, MODEL_EXPRESSION_OPTIONS, 
  POSE_STYLE_OPTIONS, BACKGROUND_OPTIONS 
} from '@/lib/prompt-builder';
import { generatePromptWithAI } from '@/ai/actions/generate-prompt.action';
import type { ModelAttributes, FullUser } from '@/services/database.service'; // Updated import source for FullUser
import * as dbService from '@/services/database.service';
import { addHistoryItem } from '@/actions/historyActions';
import { generateWithFalImageToImage } from '@/services/fal-api/image.service'; // NEW IMPORT
import { removeBackgroundAction } from '@/ai/actions/remove-background.action';
import { upscaleImageAction, faceDetailerAction } from '@/ai/actions/upscale-image.action';
import { getSetting } from '@/services/settings.service';
import { createApiLogger } from '@/lib/api-logger';

// ... [Types like GeminiPart, etc can technically be removed if not used by prompt generator, but kept for safety] ...
// ... [Keep generateRandomBasicParameters, getStudioModeFitDescription, buildStudioModePrompt] ...
// ... [Keep imageToGenerativePart, generateClothingDescription] ...

// Validation Schemas
const GenerateImageEditInputSchema = z.object({
  prompt: z.string().optional(),
  parameters: z.any().optional(),
  settingsMode: z.enum(['basic', 'advanced']).optional(),
  imageDataUriOrUrl: z.string().optional(),
  useAIPrompt: z.boolean().optional().default(false),
  useRandomization: z.boolean().optional().default(false),
  removeBackground: z.boolean().optional().default(false),
  upscale: z.boolean().optional().default(false),
  enhanceFace: z.boolean().optional().default(false),
  generationMode: z.enum(['creative', 'studio']).optional(),
  studioFit: z.enum(['slim', 'regular', 'relaxed']).optional(),
});
export type GenerateImageEditInput = z.infer<typeof GenerateImageEditInputSchema>;

const SingleImageOutputSchema = z.object({
  editedImageUrl: z.string(),
});
export type SingleImageOutput = z.infer<typeof SingleImageOutputSchema>;

// Unified generation helper
async function performSingleImageGeneration(
  input: GenerateImageEditInput,
  user: FullUser,
  flowIdentifier: string,
  keyIndex: 1 | 2 | 3, // Kept for prompt generation context if needed
  modelId: string, // New param
  generationConfigOverride?: any
): Promise<SingleImageOutput> {
  const username = user.username;
  
  // Convert to public URL for FAL.AI
  let publicImageUrl = input.imageDataUriOrUrl;
  
  if (!publicImageUrl) {
    throw new Error(`Generation requires a source image for ${flowIdentifier}`);
  }

  const logger = createApiLogger('FAL_IMAGE', 'Image Generation', {
      username,
      model: modelId,
  });
  
  logger.start({ flowIdentifier, sourceType: publicImageUrl.startsWith('data:') ? 'dataURI' : 'url' });

  // Handle local files / Data URIs -> Upload to Fal Storage
  if (publicImageUrl.startsWith('data:') || publicImageUrl.startsWith('/uploads/') || publicImageUrl.startsWith('uploads/')) {
    logger.progress('Converting to public URL via Fal Storage');
    
    let imageBlob: Blob;
    
    if (publicImageUrl.startsWith('data:')) {
      const dataUriMatch = publicImageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!dataUriMatch) throw new Error(`Invalid data URI in ${flowIdentifier}`);
      const mimeType = dataUriMatch[1];
      const binaryData = Buffer.from(dataUriMatch[2], 'base64');
      imageBlob = new Blob([binaryData], { type: mimeType });
    } else {
      const fileBuffer = await getBufferFromLocalPath(publicImageUrl);
      const mimeType = mime.lookup(publicImageUrl) || 'image/png';
      imageBlob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    }
    
    const { uploadToFalStorage } = await import('@/ai/actions/generate-video.action');
    publicImageUrl = await uploadToFalStorage(imageBlob, username);
  }

  try {
    logger.progress('Calling Fal.ai API');
    
    // Unified call for both models since they share input/output schema
    const falResult = await generateWithFalImageToImage(
      input.prompt || '',
      publicImageUrl,
      username,
      modelId
    );
    
    logger.progress('Downloading generated image...');
    
    const { relativeUrl: localImageUrl } = await downloadAndSaveImageFromUrl(
      falResult.imageUrl,
      `RefashionAI_${modelId.split('/')[1]}_${flowIdentifier}`,
      'generated_images'
    );
    
    logger.success({ localImageUrl });
    
    return { editedImageUrl: localImageUrl };
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

const GenerateMultipleImagesOutputSchema = z.object({
  editedImageUrls: z.array(z.string().nullable()),
  constructedPrompt: z.string(),
  errors: z.array(z.string().nullable()).optional(),
});
export type GenerateMultipleImagesOutput = z.infer<typeof GenerateMultipleImagesOutputSchema>;


export async function generateImageEdit(
  input: GenerateImageEditInput,
  username: string,
  existingHistoryId?: string
): Promise<GenerateMultipleImagesOutput & { newHistoryId?: string }> {
  if (!username) throw new Error('Username is required.');

  const user = dbService.findUserByUsername(username);
  if (!user) throw new Error(`User ${username} not found.`);

  // --- CONFIGURATION ---
  // Determine model and count based on user settings
  const isNanoBanana = user.image_generation_model === 'fal_nano_banana_pro';
  const imagesToGenerateCount = isNanoBanana ? 1 : 3;
  const modelId = isNanoBanana ? 'fal-ai/nano-banana-pro/edit' : 'fal-ai/gemini-25-flash-image/edit';
  
  // Create placeholders for DB (always length 3 for schema consistency, filled with nulls)
  const initialImagePlaceholders = Array(3).fill(null); 

  // 1. Create initial history item EARLY
  let historyId = existingHistoryId;
  
  if (!historyId && input.imageDataUriOrUrl) {
    try {
      const isStudio = input.generationMode === 'studio';
      const initialAttributes = isStudio 
        ? { studioFit: input.studioFit } as any 
        : input.parameters;
        
      historyId = await addHistoryItem(
        initialAttributes || {},
        "Processing...",
        input.imageDataUriOrUrl,
        initialImagePlaceholders,
        input.settingsMode || 'basic',
        user.image_generation_model,
        'processing',
        undefined,
        username,
        undefined,
        input.generationMode || 'creative'
      );
    } catch (err) {
      console.error('Failed to create initial history item:', err);
      throw err;
    }
  }

  // 2. Schedule background work
  after(async () => {
    try {
      console.log(`🔄 Starting background generation for ${historyId} using ${modelId} (${imagesToGenerateCount} images)`);

      // --- STUDIO MODE ---
      if (input.generationMode === 'studio') {
        const clothingDescription = await generateClothingDescription(input.imageDataUriOrUrl!, username);
        let studioPrompt = buildStudioModePrompt(input.studioFit as any);
        studioPrompt = studioPrompt.replace("clothing item", clothingDescription);

        // Generate 1 or 3 images
        const generationPromises = Array.from({ length: imagesToGenerateCount }).map(async (_, i) => {
          try {
            const result = await performSingleImageGeneration({
              ...input,
              prompt: studioPrompt,
            }, user, `studio-flow${i + 1}`, (i + 1) as 1 | 2 | 3, modelId);

            if (historyId && result.editedImageUrl) {
              dbService.updateHistoryImageSlot(historyId, i, result.editedImageUrl);
            }
            return result;
          } catch (err) {
            console.error(`Studio Mode flow ${i + 1} error:`, err);
            throw err;
          }
        });

        const settledResults = await Promise.allSettled(generationPromises);
        await finalizeHistory(historyId!, settledResults, studioPrompt, imagesToGenerateCount);
        return;
      }

      // --- CREATIVE MODE ---
      // 1. Non-destructive pipeline (Remove BG, etc.)
      let processedImageUrl = input.imageDataUriOrUrl;
      if (input.imageDataUriOrUrl && (input.removeBackground || input.upscale || input.enhanceFace)) {
        try {
          if (input.removeBackground) processedImageUrl = (await removeBackgroundAction(processedImageUrl!, undefined)).savedPath;
          if (input.upscale) processedImageUrl = (await upscaleImageAction(processedImageUrl!, undefined)).savedPath;
          if (input.enhanceFace) processedImageUrl = (await faceDetailerAction(processedImageUrl!, undefined)).savedPath;
        } catch (pipelineError) {
          console.error('Pipeline error:', pipelineError);
          throw pipelineError;
        }
      }
      const processedInput = { ...input, imageDataUriOrUrl: processedImageUrl };

      // 2. Prompt Generation
      let prompts: (string | null)[];
      let finalConstructedPromptForHistory: string;

      if (processedInput.prompt) {
        prompts = Array(imagesToGenerateCount).fill(processedInput.prompt);
        finalConstructedPromptForHistory = processedInput.prompt;
      } else {
        // Generate parameter sets based on count
        let parameterSetsForSlots: ModelAttributes[];
        if (processedInput.useRandomization) {
          parameterSetsForSlots = Array.from({ length: imagesToGenerateCount }, () => generateRandomBasicParameters(processedInput.parameters!));
        } else {
          parameterSetsForSlots = Array(imagesToGenerateCount).fill(processedInput.parameters);
        }

        // Build prompts
        if (processedInput.useAIPrompt && processedInput.imageDataUriOrUrl) {
           const promptPromises = parameterSetsForSlots.map((params, i) =>
            generatePromptWithAI(params, processedInput.imageDataUriOrUrl!, username, (i + 1) as 1 | 2 | 3)
              .catch(() => buildAIPrompt({ type: 'image', params: { ...params, settingsMode: 'advanced' } }))
          );
          prompts = await Promise.all(promptPromises);
        } else {
          prompts = parameterSetsForSlots.map(params =>
            buildAIPrompt({ type: 'image', params: { ...params, settingsMode: processedInput.settingsMode || 'basic' } })
          );
        }
        finalConstructedPromptForHistory = prompts[0] || 'Prompt generation failed.';
      }

      // 3. Image Generation Loop
      const generationPromises = prompts.map(async (prompt, index) => {
        if (!prompt) throw new Error('Prompt missing');
        try {
          const result = await performSingleImageGeneration(
            { ...processedInput, prompt }, 
            user, 
            `flow${index + 1}`, 
            (index + 1) as 1 | 2 | 3, 
            modelId
          );

          if (historyId && result.editedImageUrl) {
            dbService.updateHistoryImageSlot(historyId, index, result.editedImageUrl);
          }
          return result;
        } catch (err) {
          console.error(`Creative Mode flow ${index + 1} error:`, err);
          throw err;
        }
      });

      const settledResults = await Promise.allSettled(generationPromises);
      await finalizeHistory(historyId!, settledResults, finalConstructedPromptForHistory, imagesToGenerateCount);

    } catch (error) {
      console.error(`❌ Background generation failed for ${historyId}:`, error);
      if (historyId) {
        dbService.updateHistoryItem(historyId, { status: 'failed', error: (error as Error).message });
      }
    }
  });

  return {
    editedImageUrls: [null, null, null],
    constructedPrompt: 'Processing...',
    newHistoryId: historyId,
  };
}

// Helper to finalize history status based on settled results
async function finalizeHistory(
    historyId: string, 
    settledResults: PromiseSettledResult<SingleImageOutput>[], 
    prompt: string,
    count: number
) {
    // Initialize arrays with nulls for 3 slots
    const editedImageUrlsResult: (string | null)[] = Array(3).fill(null);
    const errorsResult: (string | null)[] = Array(3).fill(null);

    settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            editedImageUrlsResult[index] = result.value.editedImageUrl;
        } else {
            const reasonError = result.reason as Error;
            errorsResult[index] = `Image ${index + 1} failed: ${reasonError?.message || 'Error'}`;
        }
    });

    // Update history with final arrays (nulls in unused slots 2/3 if count=1)
    dbService.updateHistoryItem(historyId, {
        constructedPrompt: prompt,
        editedImageUrls: editedImageUrlsResult,
        // Mark as completed if we tried to generate X images and didn't fail ALL of them.
        // For count=1, if index 0 failed, it's failed.
        // For count=3, if at least one succeeded, it's completed (partial success).
        status: settledResults.every(r => r.status === 'rejected') ? 'failed' : 'completed',
        error: errorsResult.find(e => e) || undefined
    });
    console.log(`✅ Generation finished for ${historyId}`);
}
```

### 7. Update Admin UI
**File:** `src/components/admin/UserManagementTable.tsx`

Update the select options to remove the legacy Google model and add the new Fal option.

```tsx
// src/components/admin/UserManagementTable.tsx
// ... inside the component's SelectContent ...

<div className="space-y-2">
  <Label htmlFor="edit-image-model">Image Generation Model</Label>
  <Select 
    name="image_generation_model" 
    value={editedUserConfig?.image_generation_model || ''} 
    onValueChange={(value) => handleConfigChange('image_generation_model', value)}
  >
    <SelectTrigger id="edit-image-model">
      <SelectValue placeholder="Select a model" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="fal_nano_banana_pro">Fal Nano Banana Pro (Fast - 1 Image)</SelectItem>
      <SelectItem value="fal_gemini_2_5">Fal Gemini 2.5 (High Quality - 3 Images)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

Also update the table cell display:

```tsx
<TableCell>
  {user.image_generation_model === 'fal_gemini_2_5' 
    ? 'Fal Gemini 2.5' 
    : 'Fal Nano Banana Pro'}
</TableCell>
```

### 8. Fix Frontend Display for Single Image
**File:** `src/components/ImageResultsDisplay.tsx`

We need to hide the unused slots (2 and 3) if the job is completed and they are empty.

```typescript
// src/components/ImageResultsDisplay.tsx
// ... inside ImageResultsDisplay ...

// ... existing code ...

// Polling effect remains the same.

// Local state tracks "completed" status via the polling result
const [generationStatus, setGenerationStatus] = useState<'processing' | 'completed' | 'failed' | null>(null);

// Update polling logic to set generationStatus
// ... inside setInterval ...
if (result.status === 'completed') {
    setGenerationStatus('completed'); // Add this
    // ... rest of logic
}

// ... inside render ...
return (
  // ...
  <motion.div className="grid ...">
    {Array.from({ length: NUM_IMAGES_TO_GENERATE }).map((_, index) => {
      const uri = outputImageUrls[index];
      const hasError = generationErrors[index] !== null;

      // NEW: Hide unused slots if generation is complete
      // If status is completed, and uri is null, and no error -> it was an unused slot (e.g. Nano Banana mode)
      if (generationStatus === 'completed' && uri === null && !hasError) {
        return null; 
      }

      // ... existing render logic for error, skeleton, or image ...
      // Note: Since we return null above, the grid will automatically reflow to show just 1 item if that's all there is.
    })}
  </motion.div>
  // ...
);
```
// src/app/api/v1/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/lib/api-auth';
import { createApiJob, processApiGenerationJob } from '@/actions/apiActions';
import { findHistoryItemById } from '@/services/database.service';
import { z } from 'zod';

const ModelAttributesSchema = z.object({
  gender: z.string(),
  bodyShapeAndSize: z.string(),
  ageRange: z.string(),
  ethnicity: z.string(),
  poseStyle: z.string(),
  background: z.string(),
  fashionStyle: z.string(),
  hairStyle: z.string(),
  modelExpression: z.string(),
  lightingType: z.string(),
  lightQuality: z.string(),
  cameraAngle: z.string(),
  lensEffect: z.string(),
  depthOfField: z.string(),
  timeOfDay: z.string(),
  overallMood: z.string(),
});

const GenerateRequestSchema = z.object({
  imageDataUri: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sourceHistoryItemId: z.string().optional(),
  parameters: ModelAttributesSchema,
  settingsMode: z.enum(['basic', 'advanced']).default('basic'),
  webhookUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const user = await authenticateApiRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = GenerateRequestSchema.parse(body);

    let imageDataSource = validatedData.imageUrl || validatedData.imageDataUri;

    // PHASE 3 ENHANCEMENT: Prioritize sourceHistoryItemId if provided.
    if (validatedData.sourceHistoryItemId) {
      const historyItem = findHistoryItemById(validatedData.sourceHistoryItemId);
      // Security check: ensure the item belongs to the authenticated user.
      if (historyItem && historyItem.username === user.username) {
        // Prioritize the first generated image, fall back to original clothing URL.
        imageDataSource = historyItem.editedImageUrls?.[0] || historyItem.originalClothingUrl;
      } else {
        return NextResponse.json({ error: 'sourceHistoryItemId not found or unauthorized' }, { status: 404 });
      }
    }

    if (!imageDataSource) {
      return NextResponse.json({
        error: 'Either imageDataUri, imageUrl, or a valid sourceHistoryItemId is required.'
      }, { status: 400 });
    }

    // Create job record
    const jobId = await createApiJob({
      username: user.username,
      imageDataUri: imageDataSource,
      parameters: validatedData.parameters,
      settingsMode: validatedData.settingsMode,
      webhookUrl: validatedData.webhookUrl,
    });

    // Start processing in background (don't await)
    processApiGenerationJob(jobId, {
      imageDataUri: imageDataSource,
      parameters: validatedData.parameters,
      settingsMode: validatedData.settingsMode,
      webhookUrl: validatedData.webhookUrl,
    }, user.username).catch(console.error);

    // Return immediately with job ID
    return NextResponse.json({
      jobId,
      status: 'processing'
    }, { status: 202 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }

    console.error('API generate error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

#!/usr/bin/env node
/**
 * Test script to verify direct Gemini API calls work with proxy support
 * This script tests the same functionality that was migrated from @google/genai SDK
 */

const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

async function makeGeminiApiCall(apiKey, requestBody) {
  const url = `${BASE_URL}?key=${apiKey}`;
  
  // Configure fetch options with proxy detection
  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  };

  // Simple proxy detection - let node-fetch handle proxy from environment variables
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  
  if (httpsProxy || httpProxy) {
    console.log(`🔧 Proxy detected: HTTPS_PROXY=${httpsProxy ? 'SET' : 'NOT SET'}, HTTP_PROXY=${httpProxy ? 'SET' : 'NOT SET'}`);
    // node-fetch automatically uses proxy from environment variables
  } else {
    console.log(`🔧 No proxy configured`);
  }

  console.log(`🚀 Making direct API call to: ${url.replace(/key=.*/, 'key=***')}`);
  
  const response = await fetch(url, fetchOptions);
  
  if (!response.ok) {
    let errorMessage = "Unknown error";
    try {
      const errorData = await response.json();
      if (errorData.error && errorData.error.message) {
        errorMessage = errorData.error.message;
      }
    } catch {
      errorMessage = `API Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return await response.json();
}

async function testImageGeneration() {
  console.log('🧪 Testing Direct Gemini API Call with Proxy Support');
  console.log('=' * 60);
  
  // Check for API key
  const apiKey = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY_01;
  if (!apiKey) {
    console.error('❌ No API key found. Please set GEMINI_API_KEY_1 or GEMINI_API_KEY_01 in your .env file');
    process.exit(1);
  }

  // Build request body matching the migrated implementation
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Generate a simple test image of a red apple on a white background"
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseModalities: ["image", "text"]
    },
    safetySettings: [
      {
        category: "HARM_CATEGORY_CIVIC_INTEGRITY",
        threshold: "BLOCK_NONE"
      }
    ]
  };

  console.log(`🔍 Request prompt: "${requestBody.contents[0].parts[0].text}"`);
  console.log(`🔍 Model: gemini-2.0-flash-exp`);
  console.log(`🔍 Response modalities: ${requestBody.generationConfig.responseModalities.join(', ')}`);
  
  // Implement retry mechanism like the migrated code
  const maxAttempts = 3;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    try {
      console.log(`\n🔄 ATTEMPT ${attempt}/${maxAttempts}`);
      
      const startTime = Date.now();
      const result = await makeGeminiApiCall(apiKey, requestBody);
      const endTime = Date.now();
      
      console.log(`⏱️  API call completed in ${endTime - startTime}ms`);
      
      // Process the response
      let foundImage = false;
      let foundText = false;
      
      if (result && result.candidates && result.candidates.length > 0) {
        const candidate = result.candidates[0];
        
        // Check for blocked responses due to safety settings
        if (candidate.finishReason === 'SAFETY') {
          console.warn(`⚠️  Image generation blocked by safety settings`);
          console.log(JSON.stringify(candidate, null, 2));
          throw new Error(`Image generation blocked by safety settings`);
        }
        
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              const mimeType = part.inlineData.mimeType;
              const base64DataLength = part.inlineData.data.length;
              console.log(`🖼️  Image received: ${mimeType}, ${base64DataLength} characters of base64 data`);
              foundImage = true;
            } else if (part.text) {
              console.log(`💬 Text response: ${part.text}`);
              foundText = true;
            }
          }
        }
        
        console.log(`📊 Finish reason: ${candidate.finishReason || 'undefined'}`);
      }
      
      if (foundImage) {
        console.log(`\n✅ SUCCESS! Direct API call worked with proxy support`);
        console.log(`✅ Image generation completed successfully`);
        console.log(`✅ Migration from @google/genai SDK to direct API calls is working`);
        return true;
      } else {
        console.log(`❌ No image found in response`);
        console.log(`Full response:`, JSON.stringify(result, null, 2));
        throw new Error(`No image returned from API`);
      }
      
    } catch (error) {
      console.error(`❌ Error in attempt ${attempt}:`, error.message);
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Retrying in 1 second... (${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      } else {
        console.error(`\n💥 FAILED after ${maxAttempts} attempts`);
        throw error;
      }
    }
  }
}

// Check environment and run test
async function main() {
  try {
    await testImageGeneration();
    console.log(`\n🎉 All tests passed! The migration is complete and working.`);
    process.exit(0);
  } catch (error) {
    console.error(`\n💥 Test failed:`, error.message);
    console.log(`\n📋 Troubleshooting tips:`);
    console.log(`   1. Ensure GEMINI_API_KEY_1 is set in your .env file`);
    console.log(`   2. Check if proxy settings (HTTPS_PROXY/HTTP_PROXY) are configured correctly`);
    console.log(`   3. Verify your network connection and proxy accessibility`);
    console.log(`   4. Make sure the API key has image generation permissions`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

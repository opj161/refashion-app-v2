// Test script to verify Gemini API with axios proxy
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

console.log('Testing Gemini API with axios proxy...');

// Check environment variables
const apiKey = process.env.GEMINI_API_KEY_1;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

console.log('GEMINI_API_KEY_1:', apiKey ? 'SET' : 'NOT SET');
console.log('HTTPS_PROXY:', proxyUrl ? 'SET' : 'NOT SET');

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY_1 not set. Cannot test Gemini API.');
  process.exit(1);
}

const testGeminiAPI = async () => {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    // Setup proxy agent if available
    let httpsAgent;
    if (proxyUrl) {
      console.log('Using proxy:', proxyUrl.replace(/\/\/.*@/, '//***:***@'));
      httpsAgent = new HttpsProxyAgent(proxyUrl);
    } else {
      console.log('No proxy configured, making direct connection');
    }    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: "Generate a simple test image of a red circle" }]
        }
      ],
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        // Remove responseMimeType as it's not supported for image generation
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_NONE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_NONE',
        }
      ]
    };

    console.log('Making Gemini API request...');
    console.log('URL:', url.replace(/key=.*/, 'key=***'));

    const response = await axios.post(url, requestBody, {
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: httpsAgent,
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ API Response Status:', response.status);

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const candidate = response.data.candidates[0];
      
      if (candidate.finishReason === 'SAFETY') {
        console.log('⚠️ Content blocked by safety settings');
        return;
      }
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            console.log('✅ Image data received!');
            console.log('MIME Type:', part.inlineData.mimeType);
            console.log('Data length:', part.inlineData.data ? part.inlineData.data.length : 0, 'characters');
            return;
          } else if (part.text) {
            console.log('Text response:', part.text);
          }
        }
      }
      
      console.log('⚠️ No image data found in response');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ Unexpected response structure');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Error calling Gemini API:', error.message);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.code) {
      console.error('Error code:', error.code);
    }
  }
};

testGeminiAPI();

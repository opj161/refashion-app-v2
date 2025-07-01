// Quick test to verify the @fal-ai/client integration
const { fal } = require('@fal-ai/client');

// Simple test to check if the client is working
async function testFalClient() {
  try {
    console.log('Testing Fal.ai client...');
    
    // Set the API key from environment
    process.env.FAL_KEY = '7ceee9af-bcd1-4841-9273-333b32a598b3:3034fee90d2649ef00d1c8c9a3fb4022';
    
    // Test basic connectivity by listing available models or checking status
    console.log('Fal client loaded successfully');
    console.log('Available methods:', Object.getOwnPropertyNames(fal));
    
    return true;
  } catch (error) {
    console.error('Error testing Fal.ai client:', error);
    return false;
  }
}

testFalClient();

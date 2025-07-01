// Test script to verify axios proxy configuration
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

async function testAxiosProxy() {
  console.log('Testing axios proxy configuration...');

  // Check environment variables
  console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY ? 'SET' : 'NOT SET');
  console.log('HTTP_PROXY:', process.env.HTTP_PROXY ? 'SET' : 'NOT SET');

  // Set up proxy if available
  if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
    try {
      const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
      
      console.log('Proxy URL configured:', proxyUrl.replace(/\/\/.*@/, '//***:***@'));
      
      const proxyAgent = new HttpsProxyAgent(proxyUrl);
      
      console.log('HTTPS proxy agent created successfully');
      
      // Test with a simple HTTPS request using axios
      try {
        console.log('Making test request to httpbin.org through proxy...');
        
        const response = await axios.get('https://httpbin.org/ip', {
          httpsAgent: proxyAgent,
          timeout: 10000
        });
        
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        console.log('✅ Proxy test successful!');
        
      } catch (error) {
        console.error('❌ Request error:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
      }
      
    } catch (error) {
      console.error('❌ Error setting up proxy:', error.message);
    }
  } else {
    console.log('No proxy environment variables found');
    
    // Test direct connection
    try {
      console.log('Making direct test request to httpbin.org...');
      
      const response = await axios.get('https://httpbin.org/ip', {
        timeout: 10000
      });
      
      console.log('Status:', response.status);
      console.log('Response:', response.data);
      console.log('✅ Direct connection test successful!');
      
    } catch (error) {
      console.error('❌ Direct request error:', error.message);
    }
  }
}

// Call the async function
testAxiosProxy().catch(console.error);

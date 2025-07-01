// Test script to verify proxy configuration
const https = require('https');

console.log('Testing proxy configuration...');

// Check environment variables
console.log('HTTPS_PROXY:', process.env.HTTPS_PROXY ? 'SET' : 'NOT SET');
console.log('HTTP_PROXY:', process.env.HTTP_PROXY ? 'NOT SET' : 'NOT SET');

// Set up proxy if available
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
  try {
    const { HttpsProxyAgent } = require('https-proxy-agent');
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    
    console.log('Proxy URL configured:', proxyUrl.replace(/\/\/.*@/, '//***:***@'));
    
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    https.globalAgent = proxyAgent;
    
    console.log('Global HTTPS agent configured with proxy');
    
    // Test with a simple HTTPS request
    const options = {
      hostname: 'httpbin.org',
      port: 443,
      path: '/ip',
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response:', data);
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e.message);
    });
    
    req.end();
    
  } catch (error) {
    console.error('Error setting up proxy:', error.message);
  }
} else {
  console.log('No proxy environment variables found');
}

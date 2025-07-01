#!/usr/bin/env node

// Test script to simulate a FAL.ai webhook call
// Usage: node test-webhook.js

const https = require('https');
const http = require('http');

const WEBHOOK_URL = 'https://app.refashion.cc/api/video/webhook?historyItemId=test-item&username=admin';
// For local testing, use: 'http://localhost:3000/api/video/webhook?historyItemId=test-item&username=admin'

const mockWebhookPayload = {
  "request_id": "test-request-123",
  "gateway_request_id": "test-request-123", 
  "status": "OK",
  "payload": {
    "video": {
      "url": "https://v3.fal.media/files/penguin/example-video.mp4",
      "content_type": "video/mp4",
      "file_name": "generated_video.mp4",
      "file_size": 1824075
    },
    "seed": 42
  }
};

// Simulate webhook headers that FAL.ai would send
const mockHeaders = {
  'Content-Type': 'application/json',
  'X-Fal-Webhook-Request-Id': 'test-request-123',
  'X-Fal-Webhook-User-Id': 'test-user-id',
  'X-Fal-Webhook-Timestamp': Math.floor(Date.now() / 1000).toString(),
  'X-Fal-Webhook-Signature': '1234567890abcdef' // This will fail verification, but that's OK for testing
};

const url = new URL(WEBHOOK_URL);
const isHttps = url.protocol === 'https:';
const requestModule = isHttps ? https : http;

const postData = JSON.stringify(mockWebhookPayload);

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname + url.search,
  method: 'POST',
  headers: {
    ...mockHeaders,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing webhook endpoint:', WEBHOOK_URL);
console.log('Sending payload:', JSON.stringify(mockWebhookPayload, null, 2));

const req = requestModule.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log('Response headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const jsonResponse = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err);
});

req.write(postData);
req.end();

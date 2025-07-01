#!/bin/bash

# Test script for webhook endpoint
# This simulates what FAL.ai would send to our webhook

WEBHOOK_URL="https://app.refashion.cc/api/video/webhook?historyItemId=test-item-456&username=admin"
# For local testing: WEBHOOK_URL="http://localhost:3000/api/video/webhook?historyItemId=test-item-456&username=admin"

echo "Testing webhook endpoint: $WEBHOOK_URL"

# Mock payload from FAL.ai
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Fal-Webhook-Request-Id: test-request-456" \
  -H "X-Fal-Webhook-User-Id: test-user-id" \
  -H "X-Fal-Webhook-Timestamp: $(date +%s)" \
  -H "X-Fal-Webhook-Signature: abcdef1234567890" \
  -d '{
    "request_id": "test-request-456",
    "gateway_request_id": "test-request-456",
    "status": "OK", 
    "payload": {
      "video": {
        "url": "https://v3.fal.media/files/penguin/example-test-video.mp4",
        "content_type": "video/mp4",
        "file_name": "test_video.mp4",
        "file_size": 2048000
      },
      "seed": 12345
    }
  }' \
  --verbose

echo -e "\n\nTest completed. Check the server logs for webhook processing details."

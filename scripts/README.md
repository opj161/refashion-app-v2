# Scripts Directory

This directory contains utility and verification scripts for the Refashion App project.

## Utility Scripts

- **cleanup-cache.js** - Cleans up old cached image processing results to prevent unlimited cache growth
  ```bash
  # Clean up cache entries older than 30 days (default)
  node scripts/cleanup-cache.js
  
  # Clean up cache entries older than 7 days
  node scripts/cleanup-cache.js --max-age-days=7
  
  # Show help
  node scripts/cleanup-cache.js --help
  ```

## Verification Scripts (`verification/`)

The `verification/` subdirectory contains one-off test and verification scripts used during development and migration phases:

- **test-axios-proxy.js** - Tests for axios proxy functionality
- **test-direct-api.js** - Direct API endpoint testing
- **test-fal-client.js** - FAL AI client testing
- **test-gemini-axios.js** - Gemini API axios integration testing
- **test-permissions.js** - Permission system testing
- **test-proxy.js** - General proxy functionality testing
- **test-ssr-fix.js** - Server-side rendering fix verification
- **test-webhook.js** - Webhook functionality testing
- **test-webhook.sh** - Shell script for webhook testing

These scripts were moved from the project root to keep the main directory clean and organized. They can be run individually as needed for debugging or verification purposes.

## Usage

To run any verification script:

```bash
cd scripts/verification
node test-[script-name].js
```

For shell scripts:
```bash
cd scripts/verification
./test-webhook.sh
```

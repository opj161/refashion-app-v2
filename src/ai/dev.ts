
import { config } from 'dotenv';

// Ensure .env variables are loaded only in non-production environments
if (process.env.NODE_ENV !== 'production') {
  config();
}

import '@/ai/flows/generate-image-edit.ts';
import '@/ai/actions/upload-user-image.ts'; // Import the new action

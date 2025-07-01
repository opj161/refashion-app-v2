import { z } from 'zod';
import type { UserConfig, UsersConfig } from './types';

// 1. Define Zod schemas for validation
const userConfigSchema = z.object({
  password: z.string().min(1, "Password cannot be empty"),
  role: z.enum(['admin', 'user']),
});

const usersConfigSchema = z.record(z.string(), userConfigSchema);

// 2. Create a memoized function to parse and validate the config once.
let parsedConfig: UsersConfig | null = null;
let parseError: Error | null = null;

function parseAndValidateConfig(): UsersConfig {
  if (parseError) {
    throw parseError; // Re-throw the startup error on subsequent calls
  }
  if (parsedConfig) {
    return parsedConfig;
  }

  const rawConfig = process.env.APP_USERS_CONFIG;

  if (!rawConfig || rawConfig.trim() === '') {
    parseError = new Error(
      'FATAL: APP_USERS_CONFIG environment variable is not set or is empty. The application cannot start without user configuration.'
    );
    throw parseError;
  }

  try {
    const jsonConfig = JSON.parse(rawConfig);
    const result = usersConfigSchema.safeParse(jsonConfig);

    if (!result.success) {
      console.error("Zod validation errors:", result.error.flatten());
      parseError = new Error(
        `FATAL: APP_USERS_CONFIG is invalid. Please check the format. Details: ${result.error.message}`
      );
      throw parseError;
    }

    parsedConfig = result.data;
    console.log("Successfully loaded and validated user configuration.");
    return parsedConfig;
  } catch (e) {
    parseError = new Error(
      `FATAL: Failed to parse APP_USERS_CONFIG as JSON. Check for syntax errors. Raw value starts with: "${rawConfig.substring(0, 50)}..."`
    );
    throw parseError;
  }
}

// 3. Export a getter function. This will be called by the login action.
// It will throw an error on first call if config is bad, then cache the result.
export const getUsersConfig = (): UsersConfig => {
  return parseAndValidateConfig();
};

// Call it once on server startup to fail fast.
// In Next.js, this will run when the module is first imported.
try {
  getUsersConfig();
} catch (e) {
  // Log the fatal error and let the server crash.
  console.error((e as Error).message);
  // In a real production scenario, you might have more graceful shutdown logic.
  // For now, crashing on startup is the correct "fail-fast" behavior.
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

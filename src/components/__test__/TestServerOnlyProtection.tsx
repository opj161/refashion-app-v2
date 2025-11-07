/**
 * This is a test file to demonstrate that server-only protection works.
 * 
 * IMPORTANT: This file should NOT be imported or used in the application.
 * It exists solely to verify that the build will fail if a client component
 * tries to import server-only modules.
 * 
 * To test:
 * 1. Uncomment the import statement below
 * 2. Run `npm run build`
 * 3. Verify that the build fails with a server-only error
 * 4. Re-comment the import to allow the build to succeed
 */

'use client';

// UNCOMMENT THE LINE BELOW TO TEST SERVER-ONLY PROTECTION
// import { findUserByUsername } from '@/services/database.service';

export function TestServerOnlyProtection() {
  return (
    <div>
      <h1>Server-Only Protection Test</h1>
      <p>
        This component is a client component (marked with 'use client').
      </p>
      <p>
        If you uncomment the import of database.service.ts above and run
        the build, it should fail with an error about importing a
        server-only module into a client component.
      </p>
    </div>
  );
}

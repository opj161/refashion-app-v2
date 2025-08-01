// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'refashion-app',
      script: 'server.js',

      // CRITICAL: This path points to the standalone build output directory.
      cwd: './.next/standalone', 

      exec_mode: 'fork', // Use fork mode instead of cluster for Next.js

      // Optional:
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // PM2 will automatically load variables from the .env.production file
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
# Use an official Node.js runtime as a parent image
FROM node:24-alpine AS base

# --- FIX: Install sharp's native dependencies and other tools in the base stage ---
# This ensures they are available for all subsequent stages.
RUN apk add --no-cache vips-dev build-base su-exec libc6-compat \
    --repository https://alpine.global.ssl.fastly.net/alpine/edge/community/

# Only re-run when package.json or package-lock.json changes
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2. ---- Production Dependencies Stage ----
# Create a separate stage for production-only node_modules
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# 3. ---- Builder Stage ----
# This stage builds the Next.js application
FROM base AS builder
WORKDIR /app

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
# Copy package.json for npm scripts
COPY package.json ./
# Copy configuration files
COPY next.config.ts postcss.config.* tailwind.config.ts tsconfig.json tsconfig.scripts.json ./
COPY components.json ./
# Copy the source code
COPY src ./src
COPY public ./public
COPY scripts ./scripts

# Set NEXT_TELEMETRY_DISABLED before build
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 4. ---- Runner Stage (Final Image) ----
# This stage creates the final, lean production image
FROM base AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy production dependencies from the 'prod-deps' stage
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy the built application from the 'builder' stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static/

# Copy package.json to be able to run npm scripts
COPY --from=builder /app/package.json ./package.json
# Copy the compiled migration scripts and its dependencies
COPY --from=builder /app/dist/scripts ./dist/scripts
COPY --from=builder /app/dist/src ./dist/src

# Create directories for volumes. Ownership will be set by entrypoint.sh
RUN mkdir -p /app/user_data/history && \
    mkdir -p /app/uploads && \
    chmod -R 755 /app/user_data /app/uploads

# Copy and set up the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    sed -i 's/\r$//' /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
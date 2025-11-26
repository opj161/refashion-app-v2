# Dockerfile (The Final, Simple, Standard Practice Version)

# Stage 1: Base image with dependencies
FROM node:24-alpine AS base
RUN apk add --no-cache vips-dev build-base su-exec libc6-compat wget

# Install MEGAcmd from Alpine's community repository
RUN apk add --no-cache megacmd

# Stage 2: Install all dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 3: Install only production dependencies
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Stage 4: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 5: Final production image
FROM base AS runner
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# 1. Accept build arguments from docker-compose.yml to set the correct user ID.
ARG PUID=1001
ARG PGID=1001


# 2. Handle User Creation:
RUN deluser --remove-home node > /dev/null 2>&1 || true && \
    delgroup node > /dev/null 2>&1 || true && \
    addgroup -S -g ${PGID} appgroup && \
    adduser -S -H -D -u ${PUID} -G appgroup appuser && \
    mkdir -p /home/appuser && \
    chown appuser:appgroup /home/appuser

# 3. Copy application files from previous stages, setting ownership directly.
#    This is more efficient than a separate `chown` command.
COPY --chown=appuser:appgroup --from=prod-deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=builder /app/public ./public
COPY --chown=appuser:appgroup --from=builder /app/.next/standalone ./
COPY --chown=appuser:appgroup --from=builder /app/.next/static ./.next/static/
COPY --chown=appuser:appgroup --from=builder /app/package.json ./package.json
COPY --chown=appuser:appgroup --from=builder /app/dist/scripts ./dist/scripts
COPY --chown=appuser:appgroup --from=builder /app/dist/src ./dist/src

# 4. Create and set permissions for volume mount points.
RUN mkdir -p /app/user_data/history && \
    mkdir -p /app/uploads && \
    chown -R appuser:appgroup /app/user_data /app/uploads

# 5. Copy and prepare the entrypoint script.
COPY entrypoint.sh /app/entrypoint.sh

# Run modifications as root.
RUN sed -i 's/\r$//' /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Now, set the correct ownership.
RUN chown appuser:appgroup /app/entrypoint.sh

# 6. Switch to the unprivileged user for security. This is the last step before runtime.
USER appuser

EXPOSE 3000

# 7. Set the entrypoint and command to run the application.
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "server.js"]
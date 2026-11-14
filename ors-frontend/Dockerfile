# ==============================================================================
# Multi-stage Dockerfile for ORS Frontend (Next.js 16 / Node.js 20)
# Uses Next.js Standalone Output for optimized container size & AWS cloud deploy
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Install Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS deps

WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Install dependencies based on package-lock.json
COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------------------------
# Stage 2: Build Application
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables needed during build time (can be overridden via build args)
ARG NEXT_PUBLIC_BASE_API
ENV NEXT_PUBLIC_BASE_API=${NEXT_PUBLIC_BASE_API:-http://localhost:8080}
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application (generates .next/standalone)
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 3: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install wget for healthcheck and tzdata for Bangkok timezone
RUN apk add --no-cache wget tzdata
ENV TZ=Asia/Bangkok
RUN cp /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Security: Run as a non-privileged system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and standalone server output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Healthcheck to verify Next.js server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the Next.js standalone HTTP server
CMD ["node", "server.js"]


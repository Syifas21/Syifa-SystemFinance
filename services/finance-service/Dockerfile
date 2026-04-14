# ============================================
# PROJECT FINANCE - Backend Dockerfile
# Multi-stage build for optimization
# ============================================

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================
# Production Stage
# ============================================

FROM node:18-alpine

WORKDIR /app
WORKDIR /app

# Install system deps required by Prisma engines (OpenSSL) and curl for healthcheck
RUN apk add --no-cache openssl curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./
## No prisma directory; nothing to copy

# Install only production dependencies
RUN if [ -f package-lock.json ]; then \
    npm ci --only=production || npm install --omit=dev --no-fund --no-audit; \
  else \
    npm install --omit=dev --no-fund --no-audit; \
  fi && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
# Copy Prisma engine artifacts for @prisma/client runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nextjs

# Expose port (Cloud Run will override this)
EXPOSE 8080

# Set default port explicitly
ENV PORT=8080

# Health check (use curl for Alpine compatibility); allow longer startup
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -fsS http://localhost:8080/health || exit 1

# Start the application in production mode
CMD ["npm", "start"]

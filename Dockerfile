# ----------------------------------------------------
# Multi-stage Dockerfile for Figma-like Application
# ----------------------------------------------------

# Stage 1: Build Workspace
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/validation/package*.json ./packages/validation/
COPY packages/document-model/package*.json ./packages/document-model/
COPY packages/editor-commands/package*.json ./packages/editor-commands/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Install dependencies across all workspaces
RUN npm ci

# Copy full source trees
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY tsconfig.json ./

# Run Typecheck and Production Web Build
RUN npm run typecheck
RUN npm run build --workspace=@figma-app/web
RUN npm run build --workspace=@figma-app/api

# Stage 2: Runtime Production Image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy root dependencies and built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package*.json ./apps/api/
COPY --from=builder /app/apps/web/dist ./apps/web/dist

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]

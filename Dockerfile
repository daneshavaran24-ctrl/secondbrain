# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

COPY frontend/package*.json ./
# NOTE: do NOT copy .npmrc here — ignore-scripts blocks esbuild/swc postinstall binaries
RUN npm install --legacy-peer-deps

COPY frontend/ ./

RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Stage 2: Backend
FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ ./

# Copy built frontend into backend's public folder
COPY --from=frontend-builder /frontend/dist ./public

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/index.js"]

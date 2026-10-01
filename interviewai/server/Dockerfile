# Production Dockerfile for InterviewAI Express Server + ML Inference Engine
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache curl

WORKDIR /app

# Install dependencies with frozen lockfile / clean install
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy server application source code and ML models
COPY src/ ./src/
COPY ml/models/ ./ml/models/
COPY ml/data/ ./ml/data/

# Create uploads directory with appropriate permissions
RUN mkdir -p uploads && chown -R node:node /app

USER node

EXPOSE 5000

ENV PORT=5000 \
    NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/index.js"]

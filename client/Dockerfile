# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build argument for API base URL
ARG VITE_API_BASE=http://localhost:4000

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application with environment variable
ENV VITE_API_BASE=${VITE_API_BASE}
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Serve static files with SPA fallback
CMD ["serve", "-s", "dist", "-l", "3000"]

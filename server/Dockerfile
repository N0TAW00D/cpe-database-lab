FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

EXPOSE 4000

# Use node directly (no need for nodemon in production)
CMD ["node", "src/app.js"]

# Base Image - Switch to slim for better compatibility
FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Install OpenSSL (Required for Prisma)
RUN apt-get update -y && apt-get install -y openssl ca-certificates

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the code
COPY . .

# Build the application
RUN npm run build

# --- Production Image ---
FROM node:18-slim

WORKDIR /app

# Install OpenSSL in production image too
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy node_modules and built assets from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "dist/src/main"]

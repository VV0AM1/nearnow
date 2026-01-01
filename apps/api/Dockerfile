# Base Image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

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
FROM node:18-alpine

WORKDIR /app

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

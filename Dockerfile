# Base image
FROM node:18-alpine AS base

# Install necessary build tools for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS dependencies
RUN npm ci

# Development stage
FROM dependencies AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# Build stage
FROM dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production
ENV NODE_ENV=production

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database ./src/database

# Create uploads directory
RUN mkdir -p uploads/vehicles

# Expose port
EXPOSE 3000

# Run migrations and start
CMD ["sh", "-c", "npm run migration:run && npm run start:prod"]


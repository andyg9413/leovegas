# ------------------------------------------------------------------------------------------------------
# Build stage
# ------------------------------------------------------------------------------------------------------
FROM node:20.11-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# ------------------------------------------------------------------------------------------------------
# Production stage
# ------------------------------------------------------------------------------------------------------
FROM node:20.11-slim

# Install MySQL client from Debian repositories
RUN apt-get update && apt-get install -y default-mysql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies and required packages for migrations
RUN npm ci --only=production && \
    npm install ts-node typescript @types/node typeorm @nestjs/typeorm

# Copy built application and required files from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/src/database/migrations ./src/database/migrations
COPY --from=builder /usr/src/app/src/database/typeorm.config.ts ./src/database/typeorm.config.ts
COPY --from=builder /usr/src/app/tsconfig.json ./

# Make wait-for-db.sh executable
RUN chmod +x ./scripts/wait-for-db.sh

EXPOSE 3000

CMD ["sh", "-c", "./scripts/wait-for-db.sh db 3306 && npm run migration:run && npm run start:prod"]
    
# LeoVegas API

A NestJS-based REST API with TypeScript, MySQL, and Swagger documentation.

## Tech Stack

- Node.js: v20.11
- TypeScript: v5.x
- NestJS: v10.x
- MySQL: v8.0
- TypeORM
- Jest for testing
- ESLint & Prettier for code quality
- Docker & Docker Compose for containerization
- Swagger for API documentation

## Prerequisites

- Node.js v20.x or higher
- MySQL v8.0 or higher
- Docker and Docker Compose (optional)
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=leovegas_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h

# Swagger
SWAGGER_TITLE=LeoVegas API
SWAGGER_DESCRIPTION=LeoVegas NodeJS Developer API test
SWAGGER_VERSION=1.0
SWAGGER_PATH=api-docs
```

## Installation

```bash
# Install dependencies
npm install

# If you prefer yarn
yarn install
```

## Running the Application

### Development Mode

```bash
# Start in development mode with hot-reload
npm run start:dev

# Or with yarn
yarn start:dev
```

### Production Mode

```bash
# Build the application
npm run build

# Start in production mode
npm run start:prod

# Or with yarn
yarn build
yarn start:prod
```

### Using Docker

```bash
# Build and start the containers
docker-compose up --build

# Stop the containers
docker-compose down

# Run in detached mode
docker-compose up -d
```

## Database Migrations

```bash
# Generate a new migration
npm run migration:generate src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migrations
npm run migration:revert
```

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:
- Development: http://localhost:3000/api-docs
- Production: https://your-domain.com/api-docs

## Project Structure

```
src/
├── auth/              # Authentication module
├── users/             # Users module
├── database/          # Database configurations and migrations
├── common/            # Shared resources (DTOs, interfaces, etc.)
└── config/            # Application configuration
```

## Available Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
# Autochek API

Vehicle Valuation & Financing Platform built with NestJS, TypeORM, and SQLite.

---

## Prerequisites

- Node.js v18+ 
- npm v9+

---

## Getting Started

### Option A: Using Docker (Recommended - Easiest!)

```bash
# Start everything with one command
docker-compose up

# Or run in detached mode
docker-compose up -d
```

That's it! The API will be available at http://localhost:3000

**The container automatically:**
- Installs dependencies
- Runs migrations
- Seeds sample data
- Starts the application

**Login Credentials:**
- Admin: `admin@test.com` / `12345`
- User: `john.doe@example.com` / `password123`

**Stop the container:**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f
```

**Rebuild after code changes:**
```bash
docker-compose up --build
```

---

### Option B: Local Setup (Without Docker)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Environment File

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_PATH=autochek.db

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=24h

# External API (Optional - uses fallback simulation if not provided)
RAPIDAPI_KEY=your-rapidapi-key-here
RAPIDAPI_HOST=vin-lookup.p.rapidapi.com
USD_TO_NGN_RATE=1500

# Loan Configuration (Optional - has defaults)
DEFAULT_LTV_CAP=1.10
DEFAULT_APR=0.15
MAX_TERM_MONTHS=72
MIN_DOWN_PAYMENT_PCT=0.30
```

### 3. Run Database Migrations

```bash
npm run migration:run
```

This creates all required database tables.

### 4. Seed Sample Data

```bash
npm run seed
```

**Login Credentials:**
- Admin: `admin@test.com` / `12345`
- User: `john.doe@example.com` / `password123`

### 5. Start the Application

```bash
npm run start:dev
```

**URLs:**
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api

---

## Testing the API

### Via Swagger UI

1. Open http://localhost:3000/api
2. Use `POST /api/v1/auth/login`:
   ```json
   {
     "email": "admin@test.com",
     "password": "12345"
   }
   ```
3. Copy the `accessToken`
4. Click **"Authorize"** button (top right)
5. Enter: `Bearer <your-token>`
6. Test all endpoints!

### Via Postman/Curl

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"12345"}'

# Use the token in subsequent requests
curl -X GET http://localhost:3000/api/v1/vehicles \
  -H "Authorization: Bearer <your-token>"
```

---

## Database Management

### Fresh Start (Reset Everything)

```bash
rm -f autochek.db
npm run migration:run
npm run seed
npm run start:dev
```

### Making Schema Changes

1. Edit entity file (e.g., `src/vehicles/entities/vehicle.entity.ts`)
2. Generate migration:
   ```bash
   npm run migration:generate src/database/migrations/DescriptiveName
   ```
3. Run migration:
   ```bash
   npm run migration:run
   ```

### Rollback Last Migration

```bash
npm run migration:revert
```

### Check Migration Status

```bash
npm run migration:show
```

---

## Key Features

- ✅ JWT Authentication with RBAC (Admin/User roles)
- ✅ Vehicle listing with multiple image uploads
- ✅ External VIN API integration with fallback
- ✅ Guest loan applications (no login required)
- ✅ Loan eligibility validation (LTV-based)
- ✅ Admin offer creation with auto-calculations
- ✅ Real-time notifications via WebSocket
- ✅ Automatic offer expiry handling
- ✅ Comprehensive API documentation
- ✅ Database migrations for version control

---

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## Docker Commands

### Development with Docker

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up --build

# Access container shell
docker-compose exec app sh

# Run commands inside container
docker-compose exec app npm test
docker-compose exec app npm run seed
```

### Docker Production Build

```bash
# Build production image
docker build -t autochek-api:latest --target production .

# Run production container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -v $(pwd)/autochek.db:/app/autochek.db \
  autochek-api:latest
```

---

## Production Deployment

### Without Docker

```bash
# 1. Build
npm run build

# 2. Run migrations
npm run migration:run

# 3. Start
npm run start:prod
```

### With Docker

```bash
# Build production image
docker build -t autochek-api:latest --target production .

# Run with environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-production-secret \
  -e DATABASE_PATH=/app/autochek.db \
  -v $(pwd)/data:/app/data \
  --name autochek-api \
  autochek-api:latest
```

---

## Tech Stack

- **Framework**: NestJS 11
- **Database**: SQLite3 (better-sqlite3)
- **ORM**: TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.IO
- **Testing**: Jest

---

## License

UNLICENSED - Private Project

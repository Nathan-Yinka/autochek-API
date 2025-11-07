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
- Seeds sample data (safe - no duplicates on restart!)
- Starts the application

**Login Credentials:**
- Admin: `admin@test.com` / `12345`
- User: `tester@test.com` / `12345`

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

**Note:** The seed command is **safe to run multiple times** - it checks for existing data and skips duplicates!

**Login Credentials:**
- Admin: `admin@test.com` / `12345`
- User: `tester@test.com` / `12345`

### 5. Start the Application

```bash
npm run start:dev
```

**URLs:**
- API: http://localhost:3000
- Swagger Documentation: http://localhost:3000/api

---

## Testing the API

### Via Swagger UI (Interactive Documentation)

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

### Via Postman (Recommended for Testing)

**Step 1: Import Collection**

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop both files:
   - `Autochek_API.postman_collection.json`
   - `Autochek_API.postman_environment.json`
4. Click **Import**

**Step 2: Select Environment**

Click the environment dropdown (top right) → Select **"Autochek API - Environment"**

**Step 3: Start Testing**

The collection includes **38 endpoints** organized in 7 folders:
- 📁 Authentication (3)
- 📁 Vehicles (5)
- 📁 Valuations (6)
- 📁 Loan Applications (8)
- 📁 Offers (9)
- 📁 Notifications (4)
- 📁 Health Check (1)

**Quick Test Flow:**

1. **Authentication** → Click **"Login as Admin"**
   - Token automatically saved to environment ✅
   
2. **Valuations** → Click **"Evaluate Vehicle by VIN"**
   - Get suggested values for a vehicle
   
3. **Vehicles** → Click **"Create Vehicle (Admin)"**
   - Vehicle ID automatically saved ✅
   
4. **Authentication** → Click **"Login as User"**
   - Switch to user token ✅
   
5. **Loan Applications** → Click **"Submit Loan Application"**
   - Uses saved vehicleId automatically
   - Loan ID automatically saved ✅
   
6. **Authentication** → Click **"Login as Admin"** again
   
7. **Offers** → Click **"Create Offer (Admin)"**
   - Uses saved loanId automatically
   - Offer ID automatically saved ✅
   
8. **Authentication** → Click **"Login as User"** again
   
9. **Offers** → Click **"Accept Offer"** OR **"Decline Offer with Reason"**
   - Accept: Updates offer to ACCEPTED, loan to APPROVED ✅
   - Decline: Uses saved offerId automatically, admin gets reason

**All IDs are chained automatically - no copy/paste needed!** 🎯

**Pre-configured Variables:**
- `{{baseUrl}}` - http://localhost:3000/api/v1
- `{{authToken}}` - Auto-saved on login
- `{{vehicleId}}` - Auto-saved on create
- `{{loanId}}` - Auto-saved on submit
- `{{offerId}}` - Auto-saved on create
- Admin credentials: `admin@test.com` / `12345`
- User credentials: `tester@test.com` / `12345`

### Via Postman/Curl

```bash
# Login as Admin
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"12345"}'

# Login as User
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tester@test.com","password":"12345"}'

# Use the token in subsequent requests
curl -X GET http://localhost:3000/api/v1/vehicles \
  -H "Authorization: Bearer <your-token>"
```

### WebSocket - Real-Time Notifications

The API supports real-time notifications via WebSocket (Socket.IO).

**Connect to WebSocket:**
```javascript
// Using socket.io-client
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});
```

**Test Real-Time Notifications:**

1. **Open Browser Console** at http://localhost:3000
2. **Paste this code:**
```javascript
const token = 'your-jwt-token'; // Get from login
const socket = io('http://localhost:3000', { auth: { token } });
socket.on('notification', (data) => console.log('📢 Notification:', data));
```

3. **Trigger notifications** by:
   - Submitting a loan application (admin gets notified)
   - Creating an offer (user gets notified)
   - Updating loan status (user gets notified)
   - User declining offer (admin gets notified)

4. **See real-time updates** in console!

**Notification Types:**
- `loan_application_submitted` - Admin notified when user applies
- `loan_status_updated` - User notified of status changes
- `loan_approved` - User notified when loan approved
- `offer_created` - User notified of new offer
- `offer_accepted` - Admin notified when user accepts
- `offer_declined` - Admin notified when user declines

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
- ✅ User can accept/decline offers with notifications
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

## Testing Guide - Complete User Flow

This section provides a step-by-step guide to test all major features of the API.

### Prerequisites for Testing

1. Start the application (via Docker or locally)
2. Open Swagger UI: http://localhost:3000/api

---

### Flow 1: Admin Creates and Lists a Vehicle

**Step 1: Login as Admin**
```
POST /api/v1/auth/login
{
  "email": "admin@test.com",
  "password": "12345"
}
```
Copy the `accessToken` → Click "Authorize" → Paste: `Bearer <token>`

**Step 2: Evaluate a Vehicle (Get Suggested Values)**
```
POST /api/v1/valuations/evaluate
{
  "vin": "1HGCM82633A004352",
  "mileage": 50000
}
```
Response includes suggested retail value, loan value, and vehicle details.

**Step 3: Create Vehicle with Valuation**
```
POST /api/v1/vehicles
{
  "vin": "1HGCM82633A004352",
  "make": "Honda",
  "model": "Accord",
  "year": 2020,
  "mileage": 50000,
  "listingPrice": 5000000,
  "loanValue": 2800000,
  "retailValue": 4800000,
  "isLoanAvailable": true,
  "minLoanValue": 500000,
  "maxLoanPeriodMonths": 72,
  "requiredDownPaymentPct": 0.40,
  "currency": "NGN"
}
```
Upload images (optional) using the `images` field in Swagger.

**Step 4: List All Vehicles**
```
GET /api/v1/vehicles
```
See your newly created vehicle with payment estimates.

---

### Flow 2: User Applies for Loan (Authenticated)

**Step 1: Login as User**
```
POST /api/v1/auth/login
{
  "email": "tester@test.com",
  "password": "12345"
}
```
Authorize with the new token.

**Step 2: Browse Vehicles**
```
GET /api/v1/vehicles?isLoanAvailable=true
```
Find vehicles available for financing.

**Step 3: Submit Loan Application**
```
POST /api/v1/loans
{
  "vehicleId": "<vehicle-id-from-step-2>",
  "applicantName": "Test User",
  "applicantEmail": "tester@test.com",
  "applicantPhone": "+2348012345678",
  "bvn": "12345678901",
  "nin": "12345678901234",
  "dateOfBirth": "1990-01-15",
  "residentialAddress": "123 Main St, Lagos",
  "requestedLoanAmount": 2000000,
  "requestedTermMonths": 48,
  "requestedDownPaymentPct": 0.40
}
```
Response shows instant eligibility feedback.

**Step 4: Check My Applications**
```
GET /api/v1/loans
```
See your loan application with eligibility status.

---

### Flow 3: Guest Applies for Loan (No Login)

**Step 1: Logout** (Click lock icon → Logout in Swagger)

**Step 2: Submit Loan as Guest**
```
POST /api/v1/loans
{
  "vehicleId": "<vehicle-id>",
  "applicantName": "Guest User",
  "applicantEmail": "guest@example.com",
  "bvn": "98765432109",
  "requestedLoanAmount": 1500000,
  "requestedTermMonths": 36
}
```
Save the application ID from response!

**Step 3: Check Application Status (No Login Required)**
```
GET /api/v1/loans/<application-id>
```
Track your application without logging in.

**Step 4: (Optional) Register and Claim**
```
POST /api/v1/auth/register
{
  "firstName": "Guest",
  "lastName": "User",
  "email": "guest@example.com",
  "password": "12345"
}
```

Login with new account, then:
```
GET /api/v1/loans/unclaimed/mine
```
See your guest applications.

```
POST /api/v1/loans/claim/<application-id>
```
Claim the application to your account.

---

### Flow 4: Admin Reviews and Creates Offer

**Step 1: Login as Admin**
```
POST /api/v1/auth/login
{
  "email": "admin@test.com",
  "password": "12345"
}
```

**Step 2: View All Loan Applications**
```
GET /api/v1/loans/admin/all
```
See all pending loan applications (user + guest).

**Step 3: Review Specific Application**
```
GET /api/v1/loans/<application-id>
```
Check applicant details and eligibility.

**Step 4: Update Loan Status (Optional)**
```
PATCH /api/v1/loans/<application-id>/status
{
  "status": "UNDER_REVIEW"
}
```
User receives notification of status change.

**Step 5: Create Loan Offer**
```
POST /api/v1/offers
{
  "loanApplicationId": "<application-id>",
  "offeredLoanAmount": 2000000,
  "apr": 0.15,
  "termMonths": 48,
  "lenderCode": "BACKOFFICE"
}
```
System automatically:
- Calculates monthly payment
- Calculates total interest
- Updates loan status to PENDING_OFFER
- Notifies user

**Step 6: View All Offers**
```
GET /api/v1/offers/admin/all
```
See all offers across all users.

---

### Flow 5: User Reviews and Accepts/Declines Offer

**Step 1: Login as User**
```
POST /api/v1/auth/login
{
  "email": "tester@test.com",
  "password": "12345"
}
```

**Step 2: (Optional) Connect to WebSocket for Real-Time Alerts**

Open browser console and run:
```javascript
const token = 'your-jwt-token-from-step-1';
const socket = io('http://localhost:3000', { auth: { token } });
socket.on('notification', (data) => {
  console.log('🔔 Real-time notification:', data);
});
```
Now you'll receive instant notifications!

**Step 3: Check Notifications**
```
GET /api/v1/notifications
```
See notification about new offer.

**Step 4: View My Offers**
```
GET /api/v1/offers
```
See offers for your loan applications.

**Step 5: Review Specific Offer**
```
GET /api/v1/offers/<offer-id>
```
See loan amount, APR, monthly payment, total interest.

**Step 6A: Accept Offer**
```
PATCH /api/v1/offers/<offer-id>/accept
```
Offer status → ACCEPTED, Loan status → APPROVED, Admin notified!

**Step 6B: Decline Offer with Reason**
```
PATCH /api/v1/offers/<offer-id>/decline
{
  "note": "Interest rate is too high for my budget"
}
```
Admin receives notification with your reason.

---

---

### Flow 6: Testing Real-Time WebSocket Notifications

**Step 1: Open Two Browser Windows**

**Window 1 (User):**
1. Open http://localhost:3000/api
2. Login as user: `tester@test.com` / `12345`
3. Copy the token
4. Open browser console (F12)
5. Paste:
```javascript
const token = 'your-user-token';
const socket = io('http://localhost:3000', { auth: { token } });
socket.on('notification', (data) => {
  console.log('🔔 USER received:', data);
});
socket.on('connect', () => console.log('✅ Connected'));
```

**Window 2 (Admin):**
1. Open http://localhost:3000/api
2. Login as admin: `admin@test.com` / `12345`
3. Copy the token
4. Open browser console (F12)
5. Paste:
```javascript
const token = 'your-admin-token';
const socket = io('http://localhost:3000', { auth: { token } });
socket.on('notification', (data) => {
  console.log('🔔 ADMIN received:', data);
});
socket.on('connect', () => console.log('✅ Connected'));
```

**Step 2: Trigger Notifications**

In admin window:
```
POST /api/v1/offers
{
  "loanApplicationId": "<existing-loan-id>",
  "offeredLoanAmount": 2000000,
  "apr": 0.15,
  "termMonths": 48
}
```

**Watch user console** → Real-time notification appears! 🔔

In user window:
```
PATCH /api/v1/offers/<offer-id>/decline
{
  "note": "Testing real-time notifications"
}
```

**Watch admin console** → Real-time notification appears! 🔔

**Step 3: Test Multi-Device Support**

Open a 3rd browser tab, login as same user → Both tabs receive notifications!

---

### Flow 7: Advanced Features

**Vehicle Image Management**
```
# Add images to existing vehicle
POST /api/v1/vehicles/<vehicle-id>/images
(Upload files)

# Delete specific image
DELETE /api/v1/vehicles/<vehicle-id>/images/<image-id>

# Set primary image
PATCH /api/v1/vehicles/<vehicle-id>/images/<image-id>/set-primary
```

**Vehicle Filtering**
```
GET /api/v1/vehicles?make=Honda&minPrice=2000000&maxPrice=5000000&isLoanAvailable=true
```

**Valuation History**
```
GET /api/v1/valuations/vin/<vin>
```
See all past valuations for a vehicle.

**Bulk Notification Management**
```
PATCH /api/v1/notifications/mark-read
{
  "notificationIds": ["id1", "id2", "id3"]
}
```

**Delete Loan Application**
```
DELETE /api/v1/loans/<application-id>
```
Users can delete their own applications (unless offer is active).

---

### Expected Results Summary

After following the flows above, you should see:

✅ **Vehicles**: Admin can create, list, update, delete vehicles  
✅ **Valuations**: VIN evaluation with suggested values  
✅ **Loans**: Users and guests can apply for financing  
✅ **Eligibility**: Instant feedback based on LTV and down payment  
✅ **Offers**: Admin creates offers with auto-calculated payments  
✅ **Notifications**: Real-time updates via WebSocket  
✅ **Expiry**: Expired offers automatically detected  
✅ **Authorization**: Role-based access control working  
✅ **Guest Flow**: Apply without login, claim later  

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

---

## Postman Collection - API Testing Made Easy

### What's Included

Two Postman files for complete API testing:

1. **`Autochek_API.postman_collection.json`**
   - 38 pre-configured API endpoints
   - Organized in 7 logical folders
   - Automatic token management
   - Automatic ID chaining
   - Real data examples

2. **`Autochek_API.postman_environment.json`**
   - Pre-configured base URL
   - Admin & User credentials
   - Auto-populated variables

### Import & Setup (30 seconds)

**Step 1: Import Files**
1. Open Postman
2. Click **Import** (top left)
3. Drag both files into import dialog:
   - `Autochek_API.postman_collection.json`
   - `Autochek_API.postman_environment.json`
4. Click **Import**

**Step 2: Select Environment**
- Top right corner → Select **"Autochek API - Environment"**

**Done!** Ready to test ✅

### How to Use - Complete Test Flow

**1. Test as Admin:**

```
📁 Authentication
└── Login as Admin → Click Send
    ✅ Token automatically saved!

📁 Valuations
└── Evaluate Vehicle by VIN → Click Send
    ℹ️ Get suggested values for listing

📁 Vehicles
└── Create Vehicle (Admin) → Click Send
    ✅ Vehicle ID automatically saved!

📁 Loan Applications
└── Get All Loans (Admin) → Click Send
    ℹ️ See all pending applications

📁 Offers
└── Create Offer (Admin) → Click Send
    ✅ Offer ID automatically saved!
    ℹ️ User gets real-time notification!

📁 Offers
└── Accept Offer (User) → Click Send
    ✅ Offer status → ACCEPTED
    ✅ Loan status → APPROVED
    ℹ️ Admin gets real-time notification!
```

**2. Test as User:**

```
📁 Authentication
└── Login as User → Click Send
    ✅ Token automatically saved (replaces admin token)

📁 Vehicles
└── List Vehicles → Click Send
    ℹ️ Browse available vehicles

📁 Loan Applications
└── Submit Loan Application → Click Send
    ✅ Uses vehicleId from previous create!
    ✅ Loan ID automatically saved!
    ℹ️ Admin gets real-time notification!

📁 Loan Applications
└── Get My Loan Applications → Click Send
    ℹ️ See your applications

📁 Offers
└── Get My Offers → Click Send
    ℹ️ See offers for your loans

📁 Offers
└── Decline Offer with Reason → Click Send
    ✅ Uses offerId automatically!
    ℹ️ Admin gets real-time notification with your reason!

📁 Notifications
└── Get My Notifications → Click Send
    ℹ️ See all your notifications
```

**3. Test as Guest (No Auth):**

```
📁 Loan Applications
└── Submit Loan Application (Public/Guest)
    → Remove Authorization header
    → Click Send
    → Save the loan ID from response
    
📁 Loan Applications
└── Get Loan by ID (Public)
    → Use saved loan ID
    → Click Send (no auth needed!)
```

### Key Features

**🔄 Automatic Token Management**
- Login requests extract and save JWT token
- All authenticated requests use saved token
- Switch between admin/user by running different login

**🔗 Automatic ID Chaining**
- Create Vehicle → saves `vehicleId`
- Submit Loan → uses `vehicleId`, saves `loanId`
- Create Offer → uses `loanId`, saves `offerId`
- Decline Offer → uses `offerId`

**No manual copy/paste needed!** Everything flows automatically.

**📝 Pre-filled Examples**
- All requests have realistic sample data
- Filter examples included (can enable/disable)
- Credentials pre-configured in environment

**🎯 Organized Structure**
- Endpoints grouped by resource
- Clear descriptions on each request
- Admin vs User vs Public clearly marked

### Environment Variables

The environment includes:

| Variable | Description | Auto-saved |
|----------|-------------|------------|
| `baseUrl` | API base URL | ❌ Pre-set |
| `authToken` | JWT token | ✅ On login |
| `vehicleId` | Vehicle ID | ✅ On create |
| `loanId` | Loan application ID | ✅ On submit |
| `offerId` | Offer ID | ✅ On create |
| `adminEmail` | Admin email | ❌ Pre-set |
| `adminPassword` | Admin password | ❌ Pre-set |
| `userEmail` | User email | ❌ Pre-set |
| `userPassword` | User password | ❌ Pre-set |

### Testing Different Scenarios

**Scenario 1: Complete User Journey**
1. Login as User
2. List Vehicles
3. Submit Loan Application
4. Check My Applications
5. View Notifications

**Scenario 2: Admin Workflow**
1. Login as Admin
2. Evaluate Vehicle
3. Create Vehicle
4. View All Loans
5. Create Offer

**Scenario 3: Guest Flow**
1. Submit Loan (no auth)
2. Get Loan Status (no auth)
3. Register
4. Login
5. Get Unclaimed Applications
6. Claim Application

### Collection Statistics

- **Total Endpoints**: 38
- **Authentication Required**: 33
- **Public Endpoints**: 5
- **Admin Only**: 12
- **User Accessible**: 21

---

## License

UNLICENSED - Private Project

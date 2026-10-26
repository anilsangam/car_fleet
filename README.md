# EliteRide — Production Car Booking Website with Admin Panel

A production-grade, full-stack car booking website and operations admin panel designed for a single fleet business that directly owns and operates 20–50 chauffeur-driven vehicles. Built with React 18, TypeScript, Vite, Tailwind CSS, Node.js, Express, and MongoDB with Mongoose ODM.

---

## 1. Project Overview

EliteRide provides a premium customer experience for booking chauffeur-driven vehicles without forced registration, paired with a comprehensive dispatch dashboard for fleet administrators.

### Core Business Model
- **100% Company-Owned Fleet**: All cars are directly owned, insured, and maintained by the enterprise (no third-party brokers or owner marketplaces).
- **Employed Chauffeurs**: Background-verified commercial chauffeurs managed internally (no separate driver app or driver logins).
- **Payment Model**: **Strictly Cash-on-Arrival**. No advance card payments or merchant gateway complexities. The administrator records expected fare, final fare, cash collected, and outstanding balances.
- **Trip Types Supported**:
  - One-way outstation trips
  - Round-trip outstation journeys (multi-day minimum km & allowances)
  - Hourly local city rentals (e.g., 4 hrs / 40 km, 8 hrs / 80 km)
  - Same-day, next-day, and advance reservations

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router v6, React Hook Form, Zod |
| **Backend** | Node.js (v18+), Express, TypeScript, REST API architecture, Mongoose ODM, Zod, bcryptjs, Helmet, Express Rate Limit |
| **Database** | MongoDB with Mongoose schemas, compound indexes, timestamps, and validation |
| **Shared** | Monorepo package (`@car-rental/shared`) with shared TypeScript interfaces and Zod schemas |
| **Testing** | Vitest, Supertest, mongodb-memory-server (zero external dependencies during test suite execution) |
| **Internationalization**| Bilingual customer UI in **English** and **Hindi (हिन्दी)** |

---

## 3. Architecture & Monorepo Structure

```
car_rental/
├── apps/
│   ├── api/                           # Express REST API Backend
│   │   ├── src/
│   │   │   ├── config/                # Environment validation & DB connection
│   │   │   ├── controllers/           # Slim HTTP controllers
│   │   │   ├── middleware/            # Auth, Zod validation, Rate limits, Error handler
│   │   │   ├── models/                # 11 Mongoose ODM models with indexes
│   │   │   ├── routes/v1/             # Versioned API routes (/api/v1)
│   │   │   ├── scripts/               # Admin bootstrap CLI & Seed data runner
│   │   │   ├── services/              # Core business logic (Pricing, Availability, Booking)
│   │   │   ├── app.ts                 # Express application configuration
│   │   │   └── server.ts              # Server startup & graceful shutdown
│   │   ├── tests/                     # 23 automated Vitest tests
│   │   └── package.json
│   │
│   └── web/                           # React Customer & Admin Frontend
│       ├── src/
│       │   ├── components/common/     # Reusable UI design system (Buttons, Modals, Badges, etc.)
│       │   ├── components/customer/   # QuickBookingForm, CarCard, FareSummaryCard
│       │   ├── context/               # AuthContext, ToastContext
│       │   ├── i18n/                  # English & Hindi translation dictionaries
│       │   ├── layouts/               # CustomerLayout, AdminLayout
│       │   ├── pages/customer/        # Home, Cars, CarDetail, Booking, Status, Contact, Policies
│       │   ├── pages/admin/           # Dashboard, Bookings, Fleet, Drivers, Pricing, Reports, Settings
│       │   ├── services/              # Centralized apiClient with credentials: 'include'
│       │   ├── App.tsx                # Client-side router configuration
│       │   └── main.tsx
│       ├── tailwind.config.js
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared TypeScript types & Zod schemas
│       ├── src/
│       │   ├── types/index.ts         # ICar, IDriver, IBooking, FareBreakdown, etc.
│       │   ├── validators/index.ts    # bookingCreateSchema, fareEstimateSchema, etc.
│       │   └── index.ts
│       └── package.json
│
├── package.json                       # Monorepo workspace configuration
└── README.md
```

---

## 4. Double-Booking Prevention & Concurrency Control

Preventing double-booking is a mission-critical requirement for fleet operators. EliteRide enforces a robust multi-layer scheduling strategy:

1. **Service Interval with Turnaround Buffer**:
   - For every trip, the backend computes the operational service interval:
     - `start`: scheduled pickup date/time
     - `end`: estimated dropoff date/time + configured buffer (default: **60 minutes**) for vehicle sanitation, refueling, and transit back to base.
2. **Interval Overlap Formula**:
   - Two trips A and B overlap if and only if:
     $$\text{A.start} < \text{B.end} \quad \land \quad \text{A.end} > \text{B.start}$$
3. **Confirmed Schedule Verification**:
   - Only `confirmed` and `in_progress` bookings occupy a vehicle or driver schedule. `pending` requests do not permanently block resources.
4. **Per-Resource Mutex Locking (`withResourceLock`)**:
   - In-process mutex locks serialized by `carId` and `driverId` prevent race conditions when two administrators simultaneously attempt to accept or assign conflicting trips.
   - The conflict check is revalidated immediately inside the locked critical section before updating the database.
5. **Resource Release on Cancellation**:
   - Marking a booking as `cancelled` or `rejected` immediately releases the vehicle and chauffeur schedules.

---

## 5. Deterministic Fare Engine

Fares are recalculated deterministically on the server:
1. **Fixed Route Rule**: Matches origin and destination keywords (e.g., Delhi to Agra fixed tariff of ₹3,800).
2. **Hourly Tier Packages**: Matches configured duration packages (e.g., 4 hrs / 40 km, 8 hrs / 80 km).
3. **Standard Outstation Distance**:
   - One-way: Base rate per km with an 80 km minimum trip threshold.
   - Round-trip: Minimum 250 km per day with driver daily allowance (₹400/day).
4. **Night Surcharges**: Surcharge (₹300) applied for pickups between 10:00 PM and 6:00 AM.
5. **Frozen Fare Snapshot**: Upon booking creation, an exact itemized snapshot of the tariff rules and breakdown is frozen in `booking.fareSnapshot`. Subsequent price adjustments on the fleet never alter existing bookings.

---

## 6. Installation & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: v5.0 or higher running locally on port 27017 or a MongoDB Atlas URI

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` files:
```bash
# Backend environment configuration
cp apps/api/.env.example apps/api/.env

# Frontend environment configuration
cp apps/web/.env.example apps/web/.env
```

Default `apps/api/.env`:
```ini
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/car_rental
SESSION_SECRET=car-rental-production-secure-session-key-2026-supersecret!
FRONTEND_URL=http://localhost:3000
ADMIN_EMAIL=admin@eliteride.com
ADMIN_PASSWORD=Admin@12345
```

### 3. Create or Reset Initial Administrator
Use the documented secure CLI bootstrap command:
```bash
npm run bootstrap:admin
```
Or create a custom administrator:
```bash
npm --workspace=@car-rental/api run bootstrap:admin custom_admin@company.com MyStrongPassword!
```

### 4. Seed Fleet Data (Cars, Drivers & Fare Rules)
Populate realistic vehicles, commercial chauffeurs, and Delhi NCR corridors:
```bash
npm run seed
```

### 5. Start Full-Stack Development Servers
```bash
npm run dev
```
- **Customer Website**: `http://localhost:3000`
- **Admin Portal**: `http://localhost:3000/admin` (or `/admin/login`)
- **Backend API**: `http://localhost:5000/api/v1`
- **Health Probe**: `http://localhost:5000/health`

---

## 7. Testing & Verification

The test suite runs with Vitest and supertest. It requires no external internet or pre-existing databases:
```bash
npm run test
```

### Test Coverage Highlights (23 Tests Passing):
1. **Double-Booking & Concurrency Suite (`tests/double-booking.test.ts`)**:
   - Overlapping bookings on same vehicle blocked with schedule conflict error.
   - Non-overlapping trips after turnaround buffer succeed.
   - Driver schedule conflicts detected and prevented.
   - Concurrent/simultaneous acceptance attempts on same car safely resolve to 1 accepted and 1 rejected.
   - Cancellation releases vehicle schedule for subsequent bookings.
2. **Pricing Engine Suite (`tests/pricing.test.ts`)**:
   - One-way outstation with minimum distance threshold.
   - Night driving surcharge between 10 PM and 6 AM.
   - Multi-day round-trips with driver allowances.
   - Fixed route corridor matching.
   - Frozen pricing snapshot immutability.
3. **Authentication & Security Suite (`tests/auth.test.ts`)**:
   - Wrong password rejection.
   - HTTP-only secure cookie session creation.
   - Protected endpoint enforcement without session.
   - Session invalidation upon logout.
4. **Validation Suite (`tests/booking-validation.test.ts`)**:
   - Missing required fields, return date on round trips, phone format checks.
5. **Lifecycle & Status Transitions (`tests/status-transition.test.ts`)**:
   - Sequential status progression (`pending` -> `confirmed` -> `in_progress` -> `completed`).
   - Illegal status transition rejection.
   - Cash collection recording & payment receipt audit.
   - Secure customer booking lookup with driver disclosure conditions.

---

## 8. API Endpoints Overview

### Public Customer Endpoints (`/api/v1`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/settings` | Public business branding, support numbers & policies |
| `GET` | `/cars` | Browse active fleet vehicles with category/seating filters |
| `GET` | `/cars/:id` | Vehicle details, photos, specs & pricing table |
| `GET` | `/availability` | Check vehicle availability for a specific schedule |
| `POST`| `/estimate` | Deterministic live fare calculation |
| `POST`| `/bookings` | Submit new booking request (Rate limited) |
| `POST`| `/bookings/status` | Retrieve booking status by reference + phone/OTP |

### Admin Endpoints (`/api/v1/admin`) — Protected by HTTP-only Session Cookie
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Administrator login (Rate limited) |
| `POST` | `/auth/logout` | Terminate session & clear cookie |
| `GET`  | `/auth/me` | Current authenticated admin profile |
| `GET`  | `/admin/reports/metrics` | Live operational dashboard KPI metrics |
| `GET`  | `/admin/reports/export-csv` | Stream filtered bookings as CSV |
| `GET`  | `/admin/cars` | Fleet list with search, status filters & pagination |
| `POST` | `/admin/cars` | Add vehicle to company fleet |
| `PATCH`| `/admin/cars/:id` | Update vehicle details or status |
| `GET`  | `/admin/cars/:id/upcoming-bookings`| Review scheduled trips before deactivation |
| `GET`  | `/admin/drivers` | Chauffeur roster list |
| `POST` | `/admin/drivers` | Register new commercial chauffeur |
| `PATCH`| `/admin/drivers/:id` | Update driver details or status |
| `GET`  | `/admin/drivers/:id/upcoming-bookings`| Review driver assigned schedule |
| `GET`  | `/admin/bookings` | Booking registry with filters & search |
| `GET`  | `/admin/bookings/:id` | Full booking dossier with audit trail & receipts |
| `POST` | `/admin/bookings/:id/accept` | Confirm booking with double-booking check |
| `POST` | `/admin/bookings/:id/assign` | Assign car & driver with conflict detection |
| `PATCH`| `/admin/bookings/:id/status` | Safe status transition with audit log |
| `POST` | `/admin/bookings/:id/payment`| Record cash collection and final fare |
| `GET`  | `/admin/pricing` | Tariff rules list |
| `POST` | `/admin/pricing` | Create fixed corridor or hourly rule |
| `PUT`  | `/admin/settings` | Update business branding, buffers & policies |

---

## 9. Security & Production Checklist

1. **HTTP-only Cookies**: Admin authentication sessions are stored in `HttpOnly`, `SameSite=Lax` cookies, protected against XSS token theft. Set `Secure=true` in production under HTTPS.
2. **Rate Limiting**:
   - Login endpoint: 10 attempts per 15 minutes.
   - Public booking submission: 30 requests per hour.
   - Status tracking lookup: 40 requests per 15 minutes.
3. **No Account Requirement for Customers**: Customers submit bookings with mobile numbers. Reference codes (e.g. `CR-202610-A8F2`) and 6-digit verification OTPs prevent brute-force status guessing.
4. **Safe Error Handling**: Internal stack traces are suppressed in production mode (`NODE_ENV=production`).
5. **Database Backups**:
   ```bash
   # Create backup
   mongodump --uri="mongodb://127.0.0.1:27017/car_rental" --out=/backups/$(date +%F)

   # Restore backup
   mongorestore --uri="mongodb://127.0.0.1:27017/car_rental" /backups/2026-10-23/car_rental
   ```

---

## 10. Credentials & External Integrations

This application runs **100% self-contained** out of the box with zero external API key requirements.

Optional third-party integrations (can be enabled via `.env`):
- **SMS / WhatsApp Gateway** (e.g. Twilio, MSG91): Optional for automated OTP SMS delivery. In default development mode, security OTPs are surfaced directly in the response for seamless demonstration.
- **Distance Provider** (e.g. Google Maps Distance Matrix): Optional for dynamic point-to-point kilometer calculation. The system provides fallback deterministic fixed corridors and estimated distance formulas when no external map key is provided.

---

## License
Proprietary software for fleet operations. All rights reserved.


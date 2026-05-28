# Mploycheck - Employee Verification Management System

A professional enterprise-grade Employee Verification Management System built with **Angular 14+** (frontend) and **Node.js + TypeScript** (backend). Features role-based access control, JWT authentication, async API processing, and a real-time document verification workflow.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Login Credentials](#login-credentials)
- [API Endpoints](#api-endpoints)
- [Pages Overview](#pages-overview)
- [Architecture Highlights](#architecture-highlights)
- [Screenshots](#screenshots)

---

## Features

### Authentication & Authorization
- JWT-based authentication with token expiry
- Role-based access control (Admin / General User)
- Angular Route Guards (`AuthGuard`, `AdminGuard`)
- Secure password hashing with bcrypt

### Admin Panel
- Dashboard with real-time verification stats
- Verification records table with search, sort, and pagination
- Team management (Add / Edit / Delete users, change roles)
- Reports & Analytics
- Compliance center with regulatory framework tracking
- Account settings with profile update

### User Portal
- Personal verification dashboard with progress tracking
- Document upload system (4 required documents)
- Real-time verification progress (0% → 100%)
- Auto-verification simulation (backend processing)
- Final verification report generation

### Technical
- Async API processing with configurable delays (simulates cloud processing)
- RxJS Observables for all HTTP operations
- Reactive Forms with validation
- Loading spinners and error handling on every API call
- JSON file-based database (no MongoDB required)
- Modular Angular architecture with services, guards, and shared components

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 14, TypeScript, Tailwind CSS, RxJS |
| Backend | Node.js, Express 5, TypeScript |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Database | JSON file-based (local storage) |
| Styling | Tailwind CSS 3, Plus Jakarta Sans |
| Build | Angular CLI, ts-node, nodemon |

---

## Project Structure

```
mlpoycheck_challenge/
├── backend/
│   ├── src/
│   │   ├── config/          # App config & database layer
│   │   ├── controllers/     # Auth, User, Record, Document controllers
│   │   ├── middleware/      # JWT auth, role authorization, delay simulation
│   │   ├── routes/          # Express route definitions
│   │   └── server.ts        # Entry point
│   ├── data/                # JSON database files (auto-generated)
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── guards/      # AuthGuard, AdminGuard
│   │   │   ├── pages/       # All page components (14 pages)
│   │   │   ├── services/    # AuthService, ApiService
│   │   │   ├── shared/      # Sidebar, Topbar components
│   │   │   ├── app.module.ts
│   │   │   └── app-routing.module.ts
│   │   ├── assets/          # Images and static files
│   │   └── styles.scss      # Global styles with Tailwind
│   ├── tailwind.config.js
│   ├── angular.json
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v16+ installed
- **npm** v8+ installed
- No MongoDB required (uses JSON file database)

### 1. Clone the Repository

```bash
git clone https://github.com/maa101-hub/mlpoycheck_challenge.git
cd mlpoycheck_challenge
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file (or copy from `.env.example`):

```env
PORT=3000
JWT_SECRET=mploycheck_enterprise_secret_key_2024
JWT_EXPIRES_IN=24h
API_DELAY=1500
```

Start the backend server:

```bash
npm run dev
```

The API will start at `http://localhost:3000/api` and auto-seed the database with 4 users and 20 verification records on first run.

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Start the Angular dev server:

```bash
npx ng serve --port 4200
```

Open `http://localhost:4200` in your browser.

---

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@mploycheck.com | Admin@123 |
| **Admin** | manager@techcorp.com | Manager@1 |
| **General User** | user@mploycheck.com | User@123 |
| **General User** | hr@enterprise.com | Hr@12345 |

- **Admin** → Redirects to `/dashboard` (full admin panel)
- **General User** → Redirects to `/user-overview` (employee portal)

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/login` | No | Login with email/password, returns JWT |
| POST | `/api/register` | No | Public user registration |

### Users (Admin Only for CUD)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | Yes | List all users |
| GET | `/api/users/:id` | Yes | Get user by ID |
| POST | `/api/users` | Admin | Create new user |
| PUT | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

### Verification Records
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/records` | Yes | List records (search, sort, paginate) |
| GET | `/api/records/summary` | Yes | Dashboard summary stats |

### Documents (User Portal)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/documents` | Yes | Get user's uploaded documents |
| GET | `/api/documents/progress` | Yes | Get verification progress |
| POST | `/api/documents/upload` | Yes | Upload a document |
| GET | `/api/documents/report` | Yes | Get final verification report |

### Query Parameters for `/api/records`
- `search` — Filter by employee name, department, or ID
- `status` — Filter by verification status
- `riskLevel` — Filter by risk level
- `sortBy` — Sort field (default: lastUpdated)
- `sortOrder` — asc or desc (default: desc)
- `page` — Page number (default: 1)
- `limit` — Records per page (default: 10)

---

## Pages Overview

### Public Pages
| Route | Page |
|-------|------|
| `/` | Landing page (marketing) |
| `/login` | Login with role-based redirect |
| `/register` | User registration |

### Admin Pages (requires admin role)
| Route | Page |
|-------|------|
| `/dashboard` | Welcome + stats + verification log |
| `/verifications` | Records table with search/sort/pagination |
| `/reports` | Report downloads and analytics |
| `/team` | User management (CRUD) |
| `/compliance` | Regulatory frameworks and scores |
| `/settings` | Profile update + password change |
| `/support` | Help center + support tickets |

### User Pages (requires authentication)
| Route | Page |
|-------|------|
| `/user-overview` | Personal dashboard + quick actions |
| `/user-verifications` | Verification progress tracker |
| `/user-profile` | Document vault + upload system |
| `/user-settings` | Security & privacy settings |

---

## Architecture Highlights

### Angular Best Practices Used
- **Angular Services** — `AuthService`, `ApiService` for all HTTP logic
- **Reactive Forms** — Login, Register, Settings, Team management
- **RxJS Observables** — All API calls use Observable pattern
- **Route Guards** — `AuthGuard` and `AdminGuard` protect routes
- **Modular Structure** — Pages, shared components, services, guards separated
- **Component Architecture** — Reusable Sidebar and Topbar components

### Backend Best Practices Used
- **TypeScript** — Full type safety across all files
- **Express Middleware** — Auth, authorization, delay simulation
- **JWT Authentication** — Stateless token-based auth
- **Role-Based Access** — Admin vs General User permissions
- **Async Processing** — `setTimeout` middleware simulates real API latency
- **Clean REST API** — Proper HTTP methods, status codes, error responses

### Async API Processing
Every API endpoint includes a configurable delay (800ms–1500ms) to simulate real-world cloud processing. The frontend shows loading spinners during these delays, demonstrating proper async state handling with RxJS.

---

## Document Verification Flow

1. User logs in → sees 4 required documents (Photo ID, Employment Letter, Degree, Background Cert)
2. User clicks "Upload" on each document → API saves to database
3. Progress bar updates in real-time (25% per document)
4. Backend auto-verifies each document after 3 seconds
5. Once all 4 documents are uploaded → "Final Report" becomes available
6. User can view/download the verification report

---

## Scripts

### Backend
```bash
npm run dev      # Start dev server with hot-reload
npm run build    # Compile TypeScript to dist/
npm run start    # Run compiled production build
```

### Frontend
```bash
npx ng serve     # Start dev server on port 4200
npx ng build     # Production build to dist/
```

---

## License

This project is built for educational/assessment purposes.

---

## Author

Built as part of the Mploycheck Challenge — demonstrating Angular architecture, API integration, async processing, role-based access control, and clean enterprise-grade code structure.

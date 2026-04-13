# University Research Project Management System

This project is now a full-stack application:

- Frontend: Next.js 16 + React 19
- Backend: FastAPI
- Database: MySQL (preferred), PostgreSQL fallback, SQLite for local demo
- Auth: JWT access + refresh token authentication

## Folder Structure

```text
research-project-management/
├── app/                     # Next.js app router pages
├── backend/                 # FastAPI backend
│   ├── database.py          # DB adapter + migrations + schema creation + seeding
│   ├── main.py              # API routes
│   ├── requirements.txt     # Python backend dependencies
│   ├── schemas.py           # Request/response models
│   ├── security.py          # Password hashing and JWT helpers
│   └── seed_data.py         # Initial demo data
├── components/              # Reusable UI components
├── lib/
│   ├── api.ts               # Frontend API client
│   ├── auth-context.tsx     # Real authentication state
│   ├── data-context.tsx     # API-backed application state
│   ├── types.ts             # Shared frontend TypeScript types
│   └── utils.ts             # Utility helpers
├── public/                  # Static assets
├── styles/                  # Styling assets
├── .env.example             # Environment variable template
└── package.json             # Frontend scripts
```

## User Roles

- `student`
- `faculty`
- `coordinator`
- `admin`

## Current Architecture

The frontend keeps the original dashboard UI and role-based navigation, but the data now comes from the FastAPI backend instead of mock React state. The backend validates environment variables at startup, applies schema migrations, supports MySQL/PostgreSQL/SQLite, seeds demo users/projects/proposals, and exposes REST APIs that the frontend contexts consume.

## Backend Features

- Student, faculty, and coordinator self-registration
- JWT authentication
- Role-aware backend permissions
- Proposal creation, draft saving, editing, and submission
- Faculty proposal approval / rejection / revision requests
- Project listing and updates
- Progress updates
- Project application workflow
- Admin user management
- Forgot-password and reset-password flow
- Access token + refresh token flow (`/api/auth/refresh`)
- Department and statistics endpoints
- Audit logging
- Login rate limiting and request logging middleware
- Health and readiness endpoints (`/health`, `/health/readiness`)

## Database Schema

Main tables:

- `departments`
- `users`
- `proposals`
- `review_comments`
- `projects`
- `project_members`
- `milestones`
- `progress_updates`
- `project_applications`
- `audit_logs`
- `password_reset_tokens`
- `refresh_tokens`
- `schema_migrations`

Relationship summary:

- A `user` belongs to one department except admin accounts.
- A `proposal` is submitted by one student and may reference one faculty advisor.
- A `project` may come from a proposal and belongs to one department.
- A `project` has many `milestones`.
- A `project` has many team members through `project_members`.
- A `project` has many `progress_updates`.
- A `project` has many `project_applications`.
- A `proposal` has many `review_comments`.
- `audit_logs` record important actions across the system.

## Demo Credentials

- Student: `john.smith@university.edu` / `student123`
- Faculty: `dr.williams@university.edu` / `faculty123`
- Coordinator: `dr.chen@university.edu` / `coord123`
- Admin: `admin@university.edu` / `admin123`

You can also create your own account with any valid email address.

## Environment Variables

Create a `.env.local` file for the frontend and a `.env` file for the backend by copying values from `.env.example`.

Required values:

```env
APP_ENV=development
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ALLOWED_METHODS=GET,POST,PATCH,DELETE,OPTIONS
ALLOWED_HEADERS=Authorization,Content-Type
JWT_SECRET=replace-with-a-secure-secret-at-least-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
LOGIN_RATE_LIMIT_PER_MINUTE=10
DATABASE_URL=mysql://username:password@localhost:3306/university_research
DATABASE_PATH=backend\research_management.db
```

`DATABASE_URL` controls production DB selection:

- MySQL (preferred): `mysql://user:pass@host:3306/dbname`
- PostgreSQL fallback: `postgresql://user:pass@host:5432/dbname`
- Optional SQLite local fallback: omit `DATABASE_URL` and use `DATABASE_PATH`

## How To Run Locally

### 1. Frontend dependencies

The project already includes `node_modules` in this workspace. If you need to reinstall:

```bash
npm install
```

### 2. Backend dependencies

Install the Python backend packages:

```bash
pip install -r backend/requirements.txt
```

### 3. Start the FastAPI backend

```bash
npm run dev:backend
```

Backend URL:

```text
http://127.0.0.1:8000
```

### 4. Start the Next.js frontend

Open a second terminal and run:

```bash
npm run dev:frontend
```

Frontend URL:

```text
http://localhost:3000
```

### 5. Login and test

- Register a new student, faculty, or coordinator account, or
- Use one of the seeded demo accounts above

### 6. Forgot password

If you forget your password:

1. Open `/forgot-password`
2. Enter your email address
3. Open the generated reset link
4. Set a new password on `/reset-password`

## Build Verification

The frontend production build succeeds with:

```bash
npm run build
```

The backend was also smoke-tested for:

- login
- registration for multiple roles
- current-user fetch
- proposal creation
- proposal submission
- faculty approval
- forgot-password and password reset
- access-token refresh

## Simple Deployment Plan

### Recommended beginner-friendly setup

- Frontend: Vercel
- Backend: Render
- Database: Managed MySQL (preferred) or PostgreSQL

### Option A: Vercel + Render

1. Push the project to GitHub.
2. Deploy the frontend folder to Vercel.
3. Deploy the backend to Render as a Python web service.
4. Set `NEXT_PUBLIC_API_URL` in Vercel to your Render backend URL plus `/api`.
5. Set `FRONTEND_URL`, `ALLOWED_ORIGINS`, `JWT_SECRET`, `DATABASE_URL`, token expiry values, and rate-limit values in Render.

Render backend start command:

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 10000
```

### Option B: Single VM on AWS

1. Launch an EC2 instance.
2. Install Python and Node.js.
3. Clone the repo.
4. Run the FastAPI backend with `uvicorn`.
5. Build the Next.js frontend with `npm run build`.
6. Serve the frontend with `npm start`.
7. Reverse proxy both with Nginx.

## Notes

- For production, use managed MySQL first (or PostgreSQL fallback), not SQLite.
- SQLite remains useful only for local testing and demos.
- The old mock Next.js API routes were removed so the project now has one real backend source of truth.

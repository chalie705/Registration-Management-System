# Registration Management System (RMS)

A full-stack web application for managing student registration: applicants apply online, staff review and approve applications, and finance verifies payments. Every action is recorded in an audit trail.

## Table of Contents

1. [Features](#features)
2. [User Roles](#user-roles)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Database](#database)
8. [Default Accounts](#default-accounts)
9. [Registration Workflow](#registration-workflow)
10. [API Reference](#api-reference)
11. [Frontend Pages](#frontend-pages)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Known Limitations](#known-limitations)
15. [Future Improvements](#future-improvements)

---

## Features

- Secure sign in and sign up with JWT access tokens and refresh tokens
- Role-based access control with 6 roles
- Applicants create applications, upload documents, and submit them
- Reviewers add scores, comments and recommendations
- Registrar gives the final approve or reject decision
- Fee structures and payment recording, with verification by Finance
- Full status history for every application
- Audit log of every important action (who, what, when, from which IP)
- Management of programs, registration periods and users
- Search, filters and pagination on the main lists
- Responsive dark interface that works on desktop and mobile

## User Roles

| Role | Main permissions |
|---|---|
| **Super Admin** | Everything: manage users, programs, periods, fees, view all applications, final decisions, verify payments, view audit logs |
| **Admin / Registrar** | Manage programs, periods and fees; view all applications; approve or reject applications |
| **Reviewer** | View submitted applications and add reviews (recommendation, score, comments) |
| **Finance Officer** | Manage fees; view applications; verify or reject payments |
| **Applicant** | Create and submit applications, upload documents, make payments; sees only their own data |
| **Auditor** | Read-only access to applications, payments and audit logs |

Only **Applicant** accounts can be created through public sign up. Staff accounts are created by the Super Admin in the User Directory.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Lucide icons |
| Backend | Node.js, Express |
| Database | PostgreSQL (schema `rms`) |
| Query builder and migrations | Knex |
| Authentication | JWT (access token) plus hashed refresh tokens, bcryptjs |
| Validation | Joi |
| File upload | Multer |
| Security | Helmet, CORS, express-rate-limit |

## Project Structure

```
rms-project/
├── README.md
├── backend/
│   ├── .env
│   ├── knexfile.js
│   ├── package.json
│   ├── uploads/                  (uploaded documents, not committed)
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/               (env.js, db.js)
│       ├── constants/            (roles.js, statuses.js)
│       ├── utils/                (ApiError, asyncHandler, pagination, token, audit)
│       ├── middlewares/          (auth, validate, upload, errorHandler)
│       ├── database/
│       │   ├── createSchema.js
│       │   ├── migrations/       (14 migration files)
│       │   └── seeds/            (roles and sample data)
│       └── modules/
│           ├── auth/
│           ├── users/
│           ├── programs/
│           ├── periods/
│           ├── applications/
│           ├── fees/
│           ├── payments/
│           └── audit/
└── frontend/
    ├── .env
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/                  (client.js)
        ├── context/              (AuthContext.jsx)
        ├── constants/            (roles.js)
        ├── utils/                (format.js)
        ├── hooks/                (useApi.js)
        ├── components/           (ui.jsx)
        ├── layouts/              (DashboardLayout.jsx)
        └── pages/                (Auth, Overview, Applications, Programs,
                                   Periods, Fees, Payments, Users, Audit)
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- PostgreSQL 13 or newer
- Git

### 1. Clone the project

```bash
git clone https://github.com/YOUR_USERNAME/rms-project.git
cd rms-project
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create `backend/.env` (see [Environment Variables](#environment-variables)), then build the database:

```bash
npm run db:setup
npm run dev
```

The API runs at `http://localhost:5000`. Check it at `http://localhost:5000/api/health`.

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start it:

```bash
npm run dev
```

Open `http://localhost:5173`.

### Backend scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the API with auto-restart (nodemon) |
| `npm start` | Start the API normally |
| `npm run db:schema` | Create the `rms` schema |
| `npm run migrate` | Create schema and run all migrations |
| `npm run migrate:rollback` | Undo all migrations |
| `npm run seed` | Load roles, permissions and sample data |
| `npm run db:setup` | Run migrations and seeds together |

## Environment Variables

### `backend/.env`

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_registration_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_SCHEMA=rms

JWT_ACCESS_SECRET=change_this_to_a_long_random_string
JWT_ACCESS_EXPIRES=15m
REFRESH_TOKEN_DAYS=7

UPLOAD_DIR=uploads
```

For a hosted database, set `DATABASE_URL` instead of the `DB_*` values.

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` files. Generate a strong JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Database

All tables live in the PostgreSQL schema `rms`, so they stay separate from other tables in the same database.

| # | Table | Purpose |
|---|---|---|
| 1 | `roles` | The 6 roles |
| 2 | `users` | Login accounts, each linked to a role |
| 3 | `permissions` | Named permissions |
| 4 | `role_permissions` | Which role has which permission |
| 5 | `refresh_tokens` | Stored (hashed) refresh tokens |
| 6 | `applicants` | Applicant profile linked to a user |
| 7 | `programs` | Programs students can apply to |
| 8 | `registration_periods` | Open and close dates for registration |
| 9 | `applications` | Submitted applications |
| 10 | `application_documents` | Uploaded files |
| 11 | `application_reviews` | Reviewer recommendations and scores |
| 12 | `application_status_history` | Every status change |
| 13 | `fees` | Fee definitions |
| 14 | `payments` | Payment records |
| 15 | `audit_logs` | Audit trail |

## Default Accounts

Created by `npm run db:setup`. All use the same sample password.

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@rms.local | Admin@12345 |
| Admin / Registrar | registrar@rms.local | Admin@12345 |
| Reviewer | reviewer@rms.local | Admin@12345 |
| Finance Officer | finance@rms.local | Admin@12345 |
| Auditor | auditor@rms.local | Admin@12345 |
| Applicant | applicant@rms.local | Admin@12345 |

> **Important:** change these passwords (edit `src/database/seeds/002_sample_data.js` before seeding) before using the system outside your own computer.

## Registration Workflow

```
Applicant creates application          status: draft
        |  uploads documents and submits
        v
                                       status: submitted
        |  Reviewer adds a review
        v
                                       status: under_review
        |  Registrar decides
        v
                                       status: approved  or  rejected

Applicant records a payment            payment: pending
        |  Finance verifies
        v
                                       payment: confirmed  or  rejected
```

Rules enforced by the API:

- An application can only be created while a registration period is open.
- At least one document must be uploaded before submitting.
- Only draft applications can be edited or receive new documents.
- A rejection requires remarks.
- Payment references must be unique.
- Users cannot disable their own account or change their own role.

## API Reference

Base URL: `http://localhost:5000/api`. Protected routes need the header `Authorization: Bearer <accessToken>`. List endpoints accept `page` and `limit`.

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an applicant account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/refresh` | Get a new access token |
| POST | `/auth/logout` | Revoke the refresh token |
| GET | `/auth/me` | Current user |
| POST | `/auth/change-password` | Change password |

### Users (Super Admin; Registrar can read)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users (`search`, `role_id`, `is_active`) |
| GET | `/users/roles` | List roles |
| POST | `/users` | Create a user |
| GET | `/users/:id` | User details |
| PATCH | `/users/:id` | Update name, phone or role |
| PATCH | `/users/:id/status` | Enable or disable a user |

### Programs, Periods and Fees

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/programs` | List or create programs |
| GET, PUT, DELETE | `/programs/:id` | Read, update or deactivate a program |
| GET, POST | `/periods` | List or create registration periods |
| PUT | `/periods/:id` | Update or open/close a period |
| GET, POST | `/fees` | List or create fees |
| PUT | `/fees/:id` | Update a fee |

### Applications

| Method | Endpoint | Who | Description |
|---|---|---|---|
| POST | `/applications` | Applicant | Create a draft |
| GET | `/applications/my` | Applicant | Own applications |
| GET | `/applications` | Staff | All submitted applications (`status`, `search`, `program_id`, `period_id`) |
| GET | `/applications/:id` | Owner or staff | Details, documents, history, reviews |
| PATCH | `/applications/:id` | Applicant | Edit a draft |
| POST | `/applications/:id/documents` | Applicant | Upload a file (field name `file`, PDF/JPG/PNG, max 5 MB) |
| POST | `/applications/:id/submit` | Applicant | Submit the application |
| POST | `/applications/:id/review` | Reviewer | Add a review |
| POST | `/applications/:id/decision` | Registrar, Super Admin | Approve or reject |

### Payments

| Method | Endpoint | Who | Description |
|---|---|---|---|
| POST | `/payments` | Applicant | Record a payment |
| GET | `/payments/my` | Applicant | Own payments |
| GET | `/payments` | Super Admin, Registrar, Finance, Auditor | All payments (`status`) |
| PATCH | `/payments/:id/confirm` | Finance, Super Admin | Confirm or reject |

### Audit

| Method | Endpoint | Who | Description |
|---|---|---|---|
| GET | `/audit-logs` | Super Admin, Auditor | Audit trail (`action`, `entity`, `user_id`, `from`, `to`) |

### Example

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@rms.local","password":"Admin@12345"}'
```

## Frontend Pages

| URL | Page | Roles |
|---|---|---|
| `/login`, `/register` | Sign in and sign up | Public |
| `/dashboard` | Overview with statistics | All |
| `/applications` | List, create, review and decide | All |
| `/programs` | Academic programs | All (manage: Super Admin, Registrar) |
| `/periods` | Registration periods | All (manage: Super Admin, Registrar) |
| `/fees` | Fee structures | All (manage: Super Admin, Registrar, Finance) |
| `/payments` | Payments and receipts | All except Reviewer |
| `/users` | User directory | Super Admin |
| `/audit-logs` | Audit trail | Super Admin, Auditor |

## Deployment

The frontend can be hosted on **GitHub Pages**, the backend on **Render**, and the database on **Neon** (all have free tiers).

1. **Database:** create a Neon project, copy its connection string, and run
   `DATABASE_URL="<connection string>" npm run db:setup` from the `backend` folder.
2. **Backend (Render):** root directory `backend`, build command `npm install`, start command `npm start`. Set `NODE_ENV`, `DATABASE_URL`, `DB_SCHEMA`, `JWT_ACCESS_SECRET` and `CLIENT_URL` (your GitHub Pages address, without a trailing slash).
3. **Frontend (GitHub Pages):** set `base: '/rms-project/'` in `vite.config.js`, add the repository variable `VITE_API_URL` (the Render URL plus `/api`), and publish with a GitHub Actions workflow. Copy `dist/index.html` to `dist/404.html` so page refreshes work.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `EADDRINUSE: port 5000` | An old backend is still running. Run `npx kill-port 5000` and start again. |
| "Validation failed: email must be a valid email" | Email validation rejects `.local`. Use `Joi.string().email({ tlds: { allow: false } })`. |
| "Invalid email or password" | Wrong credentials, or the seed was not run. Run `npm run db:setup`. |
| "relation roles does not exist" | Migrations did not run. Drop the `rms` schema and run `npm run db:setup` again. |
| "Route not found" in the dashboard | Route files do not match the frontend. Make sure each module's routes and controller are the matching versions. |
| "Cannot reach the server" | The backend is not running or `VITE_API_URL` is wrong. |
| CORS error | `CLIENT_URL` in the backend `.env` must exactly match the frontend address. |
| Empty Application or Fee lists in the payment form | Create an application first, and make sure at least one active fee exists. |

## Known Limitations

- Uploaded documents are listed by name but cannot be downloaded yet.
- Users are not notified: there are no emails or in-app notifications.
- The `permissions` tables are seeded but access checks use role names.
- On free hosting, uploaded files are lost when the server restarts.

## Future Improvements

- In-app and email notifications
- Comments between applicants and staff on each application
- Document download and preview
- Reports and CSV or PDF export
- Password reset by email
- Cloud storage for uploaded documents

## License

This project is for educational use.
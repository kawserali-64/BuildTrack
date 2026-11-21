# BuildTrack

BuildTrack is an enterprise-grade Construction Project Management & Financial Tracking platform built with a strictly separated frontend and backend architecture.

---

## Architecture Overview

```
BuildTrack/
├── client/         # Next.js App Router (TypeScript, Tailwind CSS, shadcn/ui base)
└── server/         # Express.js REST API (Node.js, TypeScript, Mongoose, MongoDB)
```

### Supported Roles (5)
- **Admin**: Complete system governance, audits, global financials, and user management.
- **Project Manager**: Project planning, milestone tracking, task scheduling, contractor oversight.
- **Site Engineer**: Daily site progress reporting, site logs, task progress updates, material requests.
- **Finance Manager**: Budget allocation, invoice/expense verification, payout approval, financial variance.
- **Contractor**: Work progress claims, milestone completion submission, assigned task updates.

### Core Modules (10)
1. **Dashboard** (Role-tailored KPI widgets)
2. **Projects** (Project lifecycle & site details)
3. **Tasks** (Kanban & dependencies graph)
4. **Budget** (Category budget planning & versions)
5. **Expenses** (Receipt claims, multi-level review, disbursement)
6. **Materials** (Central inventory & automatic transaction ledger)
7. **Contractors** (Profiles, contracts, and ratings)
8. **Progress Reports** (Site daily logs and contractor progress claims)
9. **Analytics** (Schedule, cost variance, and productivity metrics)
10. **Users** (RBAC account administration)

---

## Getting Started (Stage 1 Setup)

### Prerequisites
- Node.js (v18+ or v22+)
- MongoDB instance (local or MongoDB Atlas connection string)

### 1. Backend Setup (`server/`)
```bash
cd server
cp .env.example .env
npm install
npm run dev
```
* Default API port: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/v1/health`

### 2. Frontend Setup (`client/`)
```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```
* Default Client port: `http://localhost:3000`

---

## Current Status: Stage 1 Completed
- [x] Separate `client/` and `server/` structures created
- [x] Next.js App Router, TypeScript, and Tailwind CSS initialized
- [x] Node.js, Express.js, and TypeScript initialized
- [x] MongoDB & Mongoose connection lifecycle configured
- [x] Initial dependencies installed (`axios`, `mongoose`, `cors`, etc.)
- [x] Base folder layout and placeholder trees organized
- [x] Environment variable templates created (`.env.example`)
- [x] Client-Server communication and CORS whitelist configured & verified

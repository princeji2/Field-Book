# Field Book

**A multi-role event attendance & certification platform.**

Field Book lets Organizers create events, Admins approve them for publication, Students check in by scanning a QR code, and — once attendance is verified — Students can generate a PDF certificate for that event.

🔗 **Live app:** [field-book-delta.vercel.app](https://field-book-delta.vercel.app/)
🔗 **Org site:** [www.orgs.social](https://www.orgs.social)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Roles](#roles)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Certificate Service](#certificate-service)
- [License](#license)

---

## Overview

Field Book is built for educational / organizational settings that run events and need a lightweight way to track attendance and issue verified certificates — without a heavyweight LMS or event-management suite.

The frontend is a React SPA backed entirely by Supabase (Postgres, Auth, Storage, Row-Level Security). A separate self-hosted Spring Boot microservice handles PDF certificate generation with Apache PDFBox.

## Features

- 🎫 **Event creation & approval workflow** — organizers submit events, admins approve before they go live
- 📷 **QR-code attendance** — students scan an event's QR code to check in; duplicate check-ins are blocked
- 📜 **Auto-generated PDF certificates** — rendered server-side from a template once attendance is confirmed
- 👥 **Three role-based dashboards** — Student, Organizer, Admin, each with its own permissions
- 🔐 **Role-change requests** — users can request a new role; admins review and approve
- 🛡️ **Database-enforced security** — 37+ Row-Level Security policies, not just frontend checks
- 📊 **Admin activity feed & audit log** — immutable history of admin actions

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS 4 + Framer Motion |
| Routing | React Router v7 (role-based route guards) |
| Backend / Data | Supabase — Postgres, Auth, Storage, PostgREST, RLS |
| Certificate service | Java 17, Spring Boot 4.1, Apache PDFBox 3, Maven |
| Hosting | Vercel (frontend) + Docker (certificate service) |

## Architecture

```
Frontend (React SPA)
  |  Supabase JS SDK (anon key)              |  HTTP POST (fetch)
  v                                          v
Supabase (Postgres, Auth, Storage, RLS)    Certificate Service (Spring Boot + PDFBox)
  ^ ---------------- service-role key (bypasses RLS) ------------------|
```

- **Frontend ↔ Supabase:** all data access goes through `@supabase/supabase-js` with the public anon key; security is enforced by RLS, not the client.
- **Frontend → Certificate service:** a plain `fetch()` POST to `/api/certificates/generate`.
- **Certificate service → Supabase:** uses the privileged service-role key to read templates and write finished certificates.

## Roles

| Role | Can do |
|---|---|
| **Student** | Browse/attend events, scan QR to check in, generate & download certificates |
| **Organizer** | Create events, display QR codes, view attendees |
| **Admin** | Approve events, manage users & roles, manage certificate templates, view audit log |

## Project Structure

```
src/
├── app/                # Screens: student.tsx, organizer.tsx, admin.tsx
│   └── routes/         # Route guards (AuthRouteGuard, RoleGuard)
├── lib/                # Service layer — all Supabase calls
│   ├── auth.ts
│   ├── events.ts
│   ├── attendance.ts
│   ├── certificates.ts
│   ├── approvals.ts
│   ├── users.ts
│   ├── roleRequests.ts
│   ├── storage.ts
│   └── activity.ts
supabase/
└── migrations/          # SQL schema + RLS policies

certificate-service/      # Spring Boot microservice (Java 17 + PDFBox)
```

## Getting Started

### Prerequisites

- Node.js + pnpm
- Java 17 + Maven (for the certificate service)
- A Supabase project

### Frontend

```bash
npm install
npm run dev
```

### Certificate service

```bash
cd certificate-service
mvn spring-boot:run
```

## Environment Variables

Create a `.env.local` in the project root:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CERTIFICATE_SERVICE_URL=your-certificate-service-url
```

## Database

Supabase Postgres with 9 tables (`profiles`, `events`, `approvals`, `certificate_templates`, `certificates`, `attendance`, `notifications`, `audit_log`, `role_change_requests`, `platform_activity`) and 4 storage buckets (`certificate-templates`, `qr-photos`, `avatars`, `certificates`). All access is governed by Row-Level Security policies — see `supabase/migrations/` for the full schema.

## Certificate Service

A standalone Spring Boot service renders certificates with Apache PDFBox: it fetches the template and student data from Supabase, draws the text fields and seal onto the background image, uploads the PDF to Storage, and writes the certificate record back to Postgres using a service-role key.

## License

© Field Book. All rights reserved.

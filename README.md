# NestJS Google Sign-In & Paystack Backend

## Overview

This project implements a backend API using **NestJS**, **PostgreSQL**, and **TypeORM** that supports:

- User authentication via **Google Sign-In (OAuth 2.0)**
- Payment processing via **Paystack**
- Secure handling of user data and transaction records

This backend is **API-only** — no frontend/UI included.

---

## Features

### Google Sign-In

- Trigger OAuth flow (`GET /auth/google`)
- Handle OAuth callback (`GET /auth/google/callback`)
- Automatically create or update users in PostgreSQL
- JWT-based session support (optional)

### Paystack Payment

- Initialize payments (`POST /payments/initiate`)
- Verify payment status (`GET /payments/verify`)
- Webhook endpoint for Paystack events (`POST /payments/webhook`)
- Track transactions in PostgreSQL

---

## Technology Stack

- **Backend:** NestJS
- **Database:** PostgreSQL (TypeORM)
- **Authentication:** Google OAuth 2.0, JWT (optional)
- **Payment Gateway:** Paystack
- **Environment Config:** dotenv

---

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/ObiFaith/nestjs-google-paystack-backend.git
cd nestjs-google-paystack-backend
```

### 2. Install dependencies

```bash
pnpm install
```

### Environment variables

> Create a .env file

```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_BASE_URL=https://api.paystack.co
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
PAYSTACK_SECRET_KEY=your_paystack_secret_key
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 4. Run the application

```bash
pnpm run start:dev
```

The API will be available at `http://localhost:3000.`

---

## Folder Structure

```bash
src/
 ├── auth/
 │    ├── auth.module.ts
 │    ├── auth.service.ts
 │    └── auth.controller.ts
 ├── user/
 │    ├── user.module.ts
 │    ├── user.service.ts
 │    └── user.schema.ts
 ├── payments/
 │    ├── payments.module.ts
 │    ├── payments.service.ts
 │    └── payments.controller.ts
 ├── app.module.ts
 └── main.ts
```

### Notes

- Only backend APIs are implemented — front-end integration is out of scope.

- Ensure your Google OAuth credentials and Paystack keys are correctly set in .env.

- For production, use `HTTPS` and secure JWT handling.


# Vendix SaaS Platform

Multi-Tenant Shop Management & POS SaaS Platform.

## Architecture

This project is built using:
- **Frontend**: React, Vite, Tailwind CSS, Zustand, React Router
- **Backend**: Node.js, Express, Prisma, PostgreSQL

## Project Setup

### Backend
1. `cd backend`
2. Run `npm install`
3. Make sure PostgreSQL is running and update `.env` with your DB details.
4. Run `npx prisma migrate dev` to setup database.
5. Run `npm run dev` to start backend server on port 3000.

### Frontend
1. `cd frontend`
2. Run `npm install`
3. Run `npm run dev` to start frontend dev server.

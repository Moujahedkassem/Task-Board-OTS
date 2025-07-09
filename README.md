# Team Task Board

A collaborative task management application with real-time updates.

## Tech Stack
- Frontend: React 18+, TypeScript, Tailwind CSS, shadcn/ui, Vite
- Backend: Node.js, tRPC, Prisma, PostgreSQL
- Infrastructure: Docker Compose

## Setup (Quick Start)
1. Copy `.env.template` to `.env` and adjust as needed.
2. Run `docker-compose up --build` to start all services.
3. Frontend: http://localhost:5173
4. Backend: http://localhost:4000
5. PostgreSQL: localhost:5432 (user: postgres, password: postgres)

## Structure
- `apps/frontend`: Vite + React app
- `apps/backend`: Node.js + tRPC + Prisma
- `prisma/schema.prisma`: Database schema

---

More details to come as development progresses. 
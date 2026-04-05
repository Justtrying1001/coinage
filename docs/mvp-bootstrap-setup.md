# Coinage MVP Bootstrap Setup

This document describes the **technical bootstrap only** for the Coinage MVP foundation.

## What was installed

- `next`, `react`, `react-dom`
  - App runtime and UI rendering with Next.js App Router.
- `tailwindcss`, `postcss`, `autoprefixer`
  - Minimal styling pipeline with utility classes.
- `prisma@5.22.0` (**pinned**)
  - Prisma CLI pinned per project documentation (`never upgrade to v7`).
- `@prisma/client@5.22.0`
  - Generated Prisma client runtime.
- `pg`
  - PostgreSQL driver compatibility for Neon PostgreSQL runtime.
- `zod`
  - Lightweight runtime environment validation.
- `typescript`, `@types/node`, `@types/react`
  - TypeScript support for Next.js app code.

## Why each dependency exists

- **Next.js stack**: provides App Router and production deploy path on Vercel.
- **Tailwind stack**: keeps MVP UI setup minimal and fast to iterate.
- **Prisma + Prisma Client**: database schema management and typed DB client.
- **pg**: Neon/PostgreSQL protocol compatibility.
- **zod**: strict env contract validation at startup/build.

## Environment variables

The MVP bootstrap uses exactly the MVP-required variables from docs:

- `POSTGRES_PRISMA_URL`
  - Runtime Prisma connection URL (Neon pooled/pgBouncer URL).
- `DIRECT_DATABASE_URL`
  - Direct DB URL for migrations only.
- `NEXT_PUBLIC_WORLD_SEED`
  - Public deterministic seed for world generation.
- `NEXT_PUBLIC_WORLD_PLANET_COUNT`
  - Public planet count for world generation.

See `.env.example` for commented examples and expected formats.

## Local run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env
   ```
3. Generate Prisma client:
   ```bash
   npm run "prisma generate"
   ```
4. (Optional) Create first migration when DB is configured:
   ```bash
   npm run "prisma migrate" -- --name init
   ```
5. Start dev server:
   ```bash
   npm run dev
   ```

## Connect Neon PostgreSQL

1. Create a Neon project/database.
2. Copy the **pooled** URL into `POSTGRES_PRISMA_URL`.
3. Copy the **direct** URL into `DIRECT_DATABASE_URL`.
4. Ensure `sslmode=require` in both URLs.
5. Run Prisma generate and migration commands.

## Deploy on Vercel

1. Import repository into Vercel.
2. Configure the 4 required env vars in Vercel Project Settings.
3. Use default Next.js build command (`npm run build`).
4. Ensure Prisma client generation runs during build (already included in `build` script).
5. Deploy.

## What is NOT implemented yet

The bootstrap intentionally excludes:

- Authentication (wallet, OAuth, pseudo flow logic)
- Gameplay systems (cities/resources/buildings logic)
- Galaxy View implementation
- Three.js rendering
- MeshyAI integration
- Non-bootstrap game database models (`Planet`, `City`, etc.)

This is foundation only: app shell, env contract, Prisma/Neon compatibility, and deploy readiness.

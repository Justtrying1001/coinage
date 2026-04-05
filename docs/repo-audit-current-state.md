# Repo Audit — Current State (as of 2026-04-05)

## 1. Executive summary

Coinage is currently in an **early bootstrap state**, not an MVP feature-complete state.

What is concretely true right now:
- A minimal Next.js App Router app is present and builds successfully when required env vars are provided.
- TypeScript, Tailwind, Prisma, and Zod-based env parsing are wired at a basic level.
- Prisma schema currently contains only a single `AppConfig` model, which is far below the MVP data surface described in `/docs`.
- There are **no gameplay routes**, no onboarding API/session logic, no galaxy page, no city/planet pages, no tests, no seed scripts, and no API handlers.

Bottom line: the repo is a valid technical bootstrap foundation, but implementation is still near-zero versus the MVP plan. Cleanup is limited; the main need is controlled next-step implementation with strict scope boundaries.

## 2. Current repo structure

### Top-level folders/files
Observed top-level state:
- `app/` — minimal App Router shell (`layout.tsx`, `page.tsx`, `globals.css`)
- `docs/` — GDD + MVP architecture/plan/bootstrap documents
- `prisma/` — single `schema.prisma`
- `src/lib/` — `env.ts` only
- Config/project files: `.env.example`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `next-env.d.ts`

### App structure
- `app/layout.tsx`: root layout + metadata only.
- `app/page.tsx`: bootstrap homepage displaying env-derived world seed/count.
- No route groups, no additional pages (`/galaxy`, `/planet`, `/city`, etc.), no `app/api`.

### Docs structure
- Legacy design docs (`00` to `07`) are present.
- Recent implementation docs are present:
  - `docs/coinage-mvp-architecture.md`
  - `docs/coinage-mvp-implementation-plan.md`
  - `docs/mvp-bootstrap-setup.md`

### Prisma structure
- `prisma/schema.prisma` contains:
  - Prisma client generator
  - PostgreSQL datasource using `POSTGRES_PRISMA_URL` + `DIRECT_DATABASE_URL`
  - single `AppConfig` model
- No migrations directory currently present.

### lib/components structure
- `src/lib/env.ts` exists.
- No `src/components` directory.
- No `src/domain`, `src/application`, `src/persistence`, or `src/ui` yet.

### Config files present
- Next: `next.config.ts`
- TypeScript: `tsconfig.json`, `next-env.d.ts`
- Tailwind: `tailwind.config.ts`, `postcss.config.js`, `app/globals.css`
- Env template: `.env.example`
- Package manifests: `package.json`, `package-lock.json`

## 3. What is actually implemented

### Technical bootstrap status (verified)

- **Next.js App Router**: Implemented at minimal level (`app/layout.tsx`, `app/page.tsx`).
- **TypeScript**: Enabled and strict (`tsconfig.json`, `.tsx` and `.ts` code).
- **Tailwind**: Installed/configured and used in homepage CSS/classes.
- **Prisma**: Installed; client generation in scripts; schema defined with PostgreSQL datasource.
- **Env validation/loading**: Implemented with `zod` in `src/lib/env.ts` for both server and public vars.
- **Vercel readiness**: Basic readiness only (standard Next build script exists; no Vercel-specific config required).
- **Neon readiness**: URL split pattern is scaffolded (`POSTGRES_PRISMA_URL` pooled + `DIRECT_DATABASE_URL` direct) in schema and `.env.example`.
- **Package scripts**: `dev`, `build`, `start`, `prisma generate`, `prisma migrate`, `typecheck` exist.
- **lint/build status**:
  - No lint script defined.
  - `npm run typecheck` passes after dependencies are installed.
  - `npm run build` passes when required env variables are provided.

### Current code implementation status by requested feature area

- **Homepage**: Exists; bootstrap status panel with env values.
- **Health route**: None.
- **Onboarding**: None.
- **Auth/session**: None (no cookies/session models/services/routes).
- **Galaxy page**: None.
- **Three.js**: Not installed/used.
- **World generation**: Not implemented (only seed/count env display).
- **API routes**: None.
- **Prisma models**: only `AppConfig`.
- **DB usage in app code**: none (no Prisma client usage in runtime code).
- **Seed/init scripts**: none beyond Prisma script aliases.
- **Tests**: none found.
- **Docs added during recent steps**: MVP architecture, implementation plan, and bootstrap setup docs are present.

## 4. What is not implemented

Missing from current repo relative to MVP implementation docs:

- Core app pages/routes:
  - `/galaxy`, `/planet/[planetId]`, `/city`, optional `/pending/[planetId]`
- API surface:
  - onboarding/session/planets/city endpoints listed in implementation plan
- Domain/application architecture:
  - no `src/domain`, `src/application`, `src/persistence/repos`, `src/ui/components`
- MVP data model:
  - no `users`, `sessions`, `planets`, `cities`, `city_resources`, `buildings`, `construction_queue`
- Gameplay systems (MVP subset):
  - join/create planet flow, pending→active logic, city bootstrap, claim-on-access resources, building queue
- Testing/quality layer:
  - no tests and no lint command

## 5. Mismatch vs docs/source-of-truth

### Matches docs intent
- Bootstrap dependencies align with `docs/mvp-bootstrap-setup.md` (Next/Tailwind/Prisma/pg/Zod/TS).
- Env variable contract in `.env.example` and `src/lib/env.ts` matches bootstrap doc.
- Build script includes Prisma generate before Next build, matching bootstrap deployment guidance.

### Missing vs docs intent
- `docs/coinage-mvp-architecture.md` recommends a much larger folder/API/domain skeleton that does not exist.
- `docs/coinage-mvp-implementation-plan.md` MVP scope is largely unimplemented in code.
- Prisma schema in docs implies minimal game entities; repo only has `AppConfig`.

### Premature / contradictory / potentially misaligned
- `AppConfig` model appears generic and is not mapped to a documented MVP runtime use-case in implementation plan.
- Architecture doc states current repo was documentation-only, but repository now includes bootstrap app code and minimal schema, so that statement is outdated.
- Rendering choice remains unresolved in docs (2D canvas vs Three.js); code currently implements neither.

### Keep / remove / postpone guidance
- **Keep**: current bootstrap (App Router, Tailwind, env parsing, Prisma datasource setup, build pipeline).
- **Postpone**: any V0/V1+ systems (wallet auth, combat, governance, market, etc.) exactly as docs state.
- **Potentially remove or replace soon**: `AppConfig` model if it remains unused after first MVP slice schema lands.

## 6. Risks / technical debt / scope leaks

### Scope leak risks
- High risk of overbuilding schema/services before first MVP slice if architecture doc is interpreted too broadly.
- Open rendering decision (2D vs Three.js) can trigger avoidable rework if coding starts before decision lock.

### Architectural risks
- Current build depends on env parsing at import-time; missing env will break startup/build immediately (intentional strictness, but operationally brittle if envs are not consistently set in all environments).
- No persistence abstraction/client setup yet; ad hoc DB access could fragment architecture if implementation starts without a pattern.

### Process/quality risks
- No lint script/check means style/static hygiene can drift as code volume increases.
- No tests means domain rule regressions are likely once gameplay logic starts.

### Foundations that are okay
- Dependency set is currently lean and mostly MVP-appropriate.
- No obvious V1+ dependency creep (no wallet SDK, no 3D stack, no job/queue infra yet).

## 7. Recommended next step

**Recommendation: cleanup first (light cleanup), then implement the first MVP slice.**

Practical immediate sequence:
1. Lock one unresolved decision before coding: **renderer for MVP** (recommended by docs: 2D canvas for speed).
2. Replace or justify `AppConfig` by introducing the first true MVP tables (users/sessions/planets minimal subset) in a migration-ready schema.
3. Implement only the first vertical slice from docs:
   - `/` pseudo onboarding form
   - `POST /api/onboarding/pseudo`
   - cookie session issue + refresh path
   - `GET /api/galaxy/planets` read-only active listing

This keeps risk low and aligns with architecture and implementation docs.

## 8. Recommended next 3 prompts in order

1. **Prompt 1 — Decision lock**
   - "Resolve and document the MVP renderer decision (2D canvas vs Three.js) in `/docs/coinage-mvp-implementation-plan.md`, with explicit rationale and non-goals."

2. **Prompt 2 — Minimal schema slice**
   - "Implement the first MVP Prisma schema slice (`users`, `sessions`, minimal `planets`) and create the initial migration; remove or justify `AppConfig` based on actual use."

3. **Prompt 3 — First end-to-end vertical slice**
   - "Implement pseudo onboarding + cookie session (`/` form + `/api/onboarding/pseudo` + session helper + `/api/session/refresh`) and add a basic `/galaxy` page consuming `GET /api/galaxy/planets` (active-only placeholder data allowed)."


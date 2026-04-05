# Coinage MVP Architecture

## Purpose

Define a build-ready architecture for the **MVP only** while preserving safe extension points for V0/V1+ without implementing those systems now.

## 1) Recommended Folder Structure

```txt
app/
  (public)/
    page.tsx                  # landing + pseudo onboarding
  galaxy/
    page.tsx                  # galaxy view
  planet/[planetId]/
    page.tsx                  # planet interior view
  city/
    page.tsx                  # city view
  api/
    onboarding/pseudo/route.ts
    session/refresh/route.ts
    galaxy/planets/route.ts
    planets/join/route.ts
    planets/create/route.ts
    planets/[planetId]/route.ts
    city/route.ts
    city/resources/route.ts
    city/buildings/start/route.ts

src/
  domain/
    sessions/
      session.types.ts
      session.service.ts
      session.rules.ts
    world/
      world.types.ts
      world.seed.ts
      world.visibility.ts
    planets/
      planet.types.ts
      planet.service.ts
      planet.rules.ts
    cities/
      city.types.ts
      city.service.ts
      city.rules.ts
    resources/
      resource.types.ts
      resource.service.ts
      resource.formulas.ts
    buildings/
      building.types.ts
      building.catalog.ts
      construction.service.ts
      construction.rules.ts

  persistence/
    prisma/
      schema.prisma
      client.ts
    repos/
      user.repo.ts
      session.repo.ts
      planet.repo.ts
      city.repo.ts
      building.repo.ts

  application/
    commands/
      onboard-player.command.ts
      join-planet.command.ts
      create-planet.command.ts
      start-construction.command.ts
    queries/
      get-galaxy.query.ts
      get-planet.query.ts
      get-city.query.ts

  ui/
    components/
      galaxy/
      planet/
      city/
      onboarding/
    hooks/
      useSession.ts
      useCityResources.ts

  lib/
    env.ts
    featureFlags.ts
    constants.ts
    validation.ts
```

## 2) Separation of Concerns

### Domain logic (`src/domain`)

- Pure game rules for MVP.
- No HTTP, no rendering, no Prisma types leaking in.
- Owns invariants:
  - one city per player,
  - pending planets hidden from galaxy,
  - activation threshold behavior,
  - resource cap-safe accrual,
  - economic building prerequisite checks.

### Application layer (`src/application`)

- Orchestrates use-cases (commands/queries).
- Coordinates repositories + domain services.
- Handles idempotency and transaction boundaries.

### API handlers (`app/api`)

- Parse request, call command/query, return DTO.
- No business rule computation inside route handlers.

### Persistence (`src/persistence`)

- Prisma schema and repository adapters.
- Transaction helpers and row-level locking strategy as needed.
- Maps DB rows to domain entities.

### Rendering (`app/*` + `src/ui`)

- Visual composition only.
- Pull data from APIs or server actions and render states.
- Do not embed gameplay rules.

## 3) Reuse vs Replace from Current Repo

Current repository status appears documentation-only (no implementation code detected).

### Reuse now

- Product terminology and rule definitions from docs.
- MVP phase breakdown from roadmap.
- Core formulas/patterns explicitly called out (claim-on-access, cap-safe math).

### Build fresh now

- Entire codebase skeleton (app + domain + persistence + API).
- Minimal Prisma schema only for MVP.
- Minimal map/city rendering implementation selected for MVP.

### Avoid adding now

- V0/V1+ models and services (combat, wallet, governance, signal, wars).
- Any heavy infra tied exclusively to post-MVP systems.

## 4) Data and Control Flow (MVP)

1. User lands on `/`, picks pseudo.
2. Onboarding command creates/loads user and issues anonymous cookie session.
3. `/galaxy` query returns only ACTIVE planets for map display.
4. User either:
   - joins ACTIVE planet with free slot, or
   - creates TOKEN planet in PENDING and gets placed in neutral city.
5. `/city` query calculates claim-on-access resources before returning city snapshot.
6. Building upgrade command enqueues construction job (max 2 concurrent).

## 5) MVP Extension Points (without implementation)

Use interfaces only; do not enable behavior.

- `TokenMetadataProvider` (for token lookup/validation source swap).
- `IdentityProvider` (anonymous for MVP, wallet/email/github later).
- `PlanetProgressionPort` (signal/branches in V1).
- `ConflictSystemPort` (combat/wars in V0/V2).
- `CommercePort` (market/shards in V3).

All future ports should have `Noop*` adapters registered during MVP.

## 6) MVP Guardrails

### Must not be implemented now

- Wallet/email/github auth flows.
- Any troop/combat/espionage mechanics.
- Governance/council/voting.
- Signal, planet branches, collective treasury logic.
- Alliances/diplomacy/war systems.
- Trading/market/shard monetization.

### Common scope traps

- Adding “just one extra field” for wars/governance into MVP schema.
- Introducing queue/jobs infra for systems not used by MVP.
- Building rendering abstraction for speculative multi-chain worlds before MVP proof.
- Prematurely wiring wallet SDKs because they are planned in V1.

### Rules to prevent V0/V1 leakage

1. Every new endpoint must map to an MVP use-case in this doc.
2. Every new table/column requires MVP runtime read/write usage.
3. Feature flags for non-MVP modules must default to disabled and unresolved in UI.
4. PR review checklist must include explicit “MVP boundary” confirmation.

## 7) Open Decisions Log (to resolve before coding starts)

1. Final renderer choice for MVP: **2D Canvas vs Three.js**.
2. Planet slot assignment algorithm (deterministic seed-based vs persisted allocator).
3. Token validation behavior if external metadata API is unavailable.
4. Session expiry duration and reissue cadence.
5. Polling interval and consistency strategy for resources/construction timers.

## 8) Suggested First Build Slice

- Implement onboarding + cookie session + galaxy active-planet read-only listing.
- No planet creation yet in first slice.
- This validates app shell, session, persistence, and UI plumbing with minimum risk.

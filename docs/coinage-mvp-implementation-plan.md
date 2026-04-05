# Coinage MVP Implementation Plan

## 1) Canonical Scope Baseline (from existing docs)

This plan treats the repository docs as source of truth, with one precedence rule:

1. **`07-Roadmap-Build (1).md` defines version boundaries (MVP vs V0/V1/V2/V3).**
2. Domain docs (`01..06`) define game systems, but many include post-MVP content and must be filtered through roadmap boundaries.

## 2) MVP Scope (Exact)

### Included in MVP

- Anonymous onboarding via **pseudo + cookie session only**.
- Galaxy view with procedural planets based on `NEXT_PUBLIC_WORLD_SEED`.
- Join active planet **or** create token planet (PENDING).
- PENDING planets are invisible until activation threshold is reached.
- Founder flow for planet creation.
- Activation threshold behavior (5 players, no expiry).
- City view.
- Passive resource production (claim-on-access).
- Economic buildings only for MVP progression:
  - HQ (MVP levels constrained)
  - Mine
  - Quarry
  - Refinery (when unlocked)
  - Warehouse
  - Housing
- Simple planet interior view (list cities/slots/navigation).

### Explicitly excluded from MVP

- Any auth beyond anonymous cookie session (wallet, email, GitHub).
- Combat, troops, raids, sieges, anti-bully.
- Espionage and vault systems.
- Governance, council, voting.
- Signal and planet branches.
- Alliances, diplomacy, wars.
- Trading/market.
- Monetization/Shards economy.
- Seasons/end game/leaderboards/events.

## 3) Documentation Audit

## 3.1 What is clearly defined for MVP

- MVP as no-auth pseudo onboarding is explicit in roadmap.
- PENDING->ACTIVE token-planet activation flow is explicitly defined.
- Founder role exists already in docs.
- 1 player = 1 city (MVP rule).
- Core MVP loop is navigation + build economy + passive production.

## 3.2 What belongs to V0/V1+ and must not leak

- V0: email/GitHub auth, combat, military buildings, espionage baseline.
- V1+: wallet auth, token-holding verification, on-chain pipeline, Signal branches.
- V2+: governance/council, collective army, formal wars/alliances.
- V3: market/trading, monetization, endgame/saisons/prizepool.

## 3.3 Ambiguities, contradictions, missing details (must be called out)

1. **Rendering contradiction**
   - Roadmap MVP says 2D canvas "identical GitCities" for galaxy/city.
   - Technical stack doc says Three.js for galaxy/city as core direction.
   - **MVP decision needed:** pick one rendering stack for MVP (recommended: 2D canvas for speed).

2. **Auth contradiction**
   - Roadmap MVP says pseudo+cookie only.
   - Technical stack doc globally frames Privy wallet auth and auth secrets as required.
   - **MVP decision:** wallet/auth-secret stack is deferred; only anonymous cookie session for MVP.

3. **Planet model overreach**
   - Technical schema includes many V1+/V2+ fields (signal, alliances, war, governance).
   - MVP only needs a minimal subset; full schema now risks scope bleed.

4. **World generation ambiguity**
   - Some docs frame all planets pre-generated neutral.
   - MVP roadmap also says token mother planets are dynamically created when requested.
   - **MVP interpretation:** keep procedural world seeded; represent token planets as records that become visible only on activation.

5. **Pending-planet player routing missing detail**
   - Docs state founder plays on neutral while pending, but do not fully specify what happens to those temporary cities at activation.
   - **MVP rule to define now:** no automatic migration in MVP; activation only affects discoverability and future joins.

6. **Balancing inputs intentionally undefined**
   - Resource formulas, costs, timings are listed as TBD.
   - MVP must ship with placeholder constants stored centrally and marked tunable.

## 3.4 Technical decisions already fixed by docs

- Next.js App Router + TypeScript.
- PostgreSQL + Prisma (pin version discipline noted in docs).
- `NEXT_PUBLIC_WORLD_SEED` required.
- Claim-on-access resource accrual model.
- Two-slot construction queue in MVP.

## 3.5 Technical decisions still open

- 2D canvas vs Three.js for MVP rendering.
- Exact DB table names/fields for anonymous session identity and city placement.
- API design style (REST route handlers vs server actions mix).
- World map storage strategy (fully procedural at read vs partially persisted activations/slots).
- Tick/poll cadence defaults and performance thresholds.

## 4) Implementation Order (Practical)

### Phase A — MVP skeleton and guardrails

1. Add feature flags / constants that codify MVP exclusions.
2. Create minimal domain model interfaces and service boundaries.
3. Create seed config surface (`WORLD_SEED`, activation threshold).

### Phase B — Anonymous onboarding

1. Landing page + pseudo form validation.
2. Anonymous user creation/upsert + signed cookie session.
3. Session middleware/helpers.

### Phase C — Galaxy and planet entry

1. Galaxy route + planet read model.
2. Active planet joining flow.
3. Token planet creation flow (PENDING, founder assignment).
4. Hidden pending behavior + activation counter updates.

### Phase D — City bootstrap and economic loop

1. City creation rules (1 user => 1 city).
2. Resource accrual service (claim-on-access).
3. Economic building catalog and prereq checks.
4. Construction queue (2 slots) + timers.

### Phase E — Planet and city views

1. Planet view list and navigation.
2. City HUD resources + building actions.
3. Polling/update strategy.

### Phase F — Hardening

1. Constraint checks and anti-duplication (idempotent create/join).
2. Basic audit logs / observability markers.
3. Minimal tests for domain invariants.

## 5) Core Domain Modules (MVP)

- `sessions`: pseudo identity + cookie lifecycle.
- `players`: player profile and current city linkage.
- `world`: seeded world generation + activation visibility filters.
- `planets`: join/create/activation logic.
- `cities`: city provisioning and ownership invariants.
- `resources`: claim-on-access calculations and caps.
- `buildings`: economic building rules and construction queue.

## 6) Minimal DB Surface (MVP)

Minimum entities to build now:

1. `users`
   - `id`, `pseudo`, `created_at`, `last_seen_at`
2. `sessions`
   - `id`, `user_id`, `cookie_token_hash`, `expires_at`, `created_at`
3. `planets`
   - `id`, `kind` (`NEUTRAL`|`TOKEN`), `status` (`PENDING`|`ACTIVE`), `token_address?`, `token_symbol?`, `token_name?`, `token_logo_url?`, `founder_user_id?`, `activation_player_count`, `activation_threshold`, `pos_x?`, `pos_y?`, `slot_count`, `created_at`, `activated_at?`
4. `cities`
   - `id`, `user_id`, `planet_id`, `slot_index`, `hq_level`, `created_at`, `last_resource_calc_at`
5. `city_resources`
   - `city_id`, `ore`, `stone`, `iron`, `ore_cap`, `stone_cap`, `iron_cap`
6. `buildings`
   - `id`, `city_id`, `type`, `level`, `started_at`, `completed_at?`
7. `construction_queue`
   - `id`, `city_id`, `building_type`, `target_level`, `status`, `start_at`, `end_at`

Deferred tables (do not add now): wars, alliances, council, troops, spy missions, signal branches, monetization.

## 7) Minimal API Surface (MVP)

- `POST /api/onboarding/pseudo`
- `POST /api/session/refresh`
- `GET /api/galaxy/planets` (active only by default)
- `POST /api/planets/join`
- `POST /api/planets/create`
- `GET /api/planets/:planetId`
- `GET /api/city`
- `POST /api/city/buildings/start`
- `POST /api/city/buildings/collect` (optional, if separate from city read)
- `GET /api/city/resources`

## 8) Main App Routes/Pages (MVP)

- `/` landing + pseudo onboarding
- `/galaxy` map + planet selection card
- `/planet/:planetId` planet interior view
- `/city` player city view
- Optional `/pending/:planetId` status page for founder/pending members

## 9) Stub/Defer Intentionally

Implement only placeholders/interfaces for:

- external token metadata validation adapter (real integration can start now but keep minimal);
- auth provider abstraction (wallet/email/github stubs only as future adapters);
- macro systems ports (signal/governance/war) behind disabled feature flags.

No domain behaviors for those systems in MVP runtime.

## 10) MVP Guardrails (Non-negotiable)

- If a PR adds troop, combat, spy, governance, alliance, market, shard purchase, or wallet verification logic, it is **out of scope**.
- If a data model/table/endpoint is added only for V0/V1+, reject unless explicitly marked as non-executed extension scaffold.
- Keep all MVP player identity anonymous; no password reset, OAuth, wallet signatures.
- Keep gameplay strictly city economy + navigation; no player-vs-player actions.
- Avoid “quick add” fields in MVP tables that encode future governance/war state.

## 11) Acceptance Checklist for MVP Foundation

- [ ] Docs reflect strict MVP boundary.
- [ ] Architecture split defined and mapped to modules.
- [ ] Minimal schema drafted and approved.
- [ ] Minimal API/routes drafted and approved.
- [ ] Contradictions documented with explicit chosen interpretations.
- [ ] Next implementation step can start without revisiting scope assumptions.

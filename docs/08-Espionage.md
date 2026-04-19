# Espionage (Coinage runtime, Grepolis-equivalent logic)

## Scope
This document describes the **actual runtime espionage logic** implemented in Coinage as of this commit.

## Core model
- Espionage is funded by **silver stored in the Intelligence Center vault** (`spyVaultSilver`).
- Silver is deposited from city **iron** and cannot be withdrawn.
- A mission requires at least **1000 silver**.
- One active outgoing espionage mission per city (`espionageMissions.length <= 1`).

## Intelligence Center and silver capacity
- Intelligence Center level gates espionage and silver storage:
  - level `N` stores up to `N * 1000` silver.
  - level 10 has infinite capacity.
- Vault refill is blocked while a mission is in transit.
- Capacity check includes both:
  - silver currently in vault,
  - silver currently committed in active in-flight mission(s).
- Skyguard Tower is intentionally **not** part of espionage math; it is reserved for defensive/anti-air role.

## Mission resolution
- Mission launch consumes committed silver from the source vault immediately.
- Travel duration is currently fixed at **15 minutes** in runtime (`ESPIONAGE_TRAVEL_MS`), because the current MVP city model does not yet expose inter-city distance for variable travel times.
- Resolution success rule:
  - `silver_sent > target_vault_silver`,
  - with a cryptography-like modifier if defender has `signals_intel` completed: attacker must beat `floor(target_vault_silver * 1.2)`.

## Failure / defense behavior
- On failed espionage:
  - attacker receives `attack_failed` report,
  - defender receives `defense_failed_attempt` report,
  - defender vault loses silver equal to the attempted mission silver (clamped to available silver).
- On successful espionage:
  - attacker receives `attack_success` report,
  - defender receives `defense_breached` marker report (Coinage runtime visibility choice).

## Reports and persistence
- Reports are persisted per city in `espionageReports` (capped to latest 20 entries).
- Global espionage resolution runs during city-state load so cross-city outcomes apply even if only one city is opened at a time.

## UI surface
- Intelligence page now includes:
  - vault silver KPI,
  - “Bank 1000 silver” action,
  - mission launch controls (`target city id`, `silver`),
  - latest espionage report feed.

## Known deviation vs full Grepolis
- Oracle-like “successful spy detection only if special building exists” is not modeled as a separate building yet; defender receives a `defense_breached` report in current Coinage runtime.
- Mission travel-time-by-distance is approximated by fixed travel time pending broader world routing integration.

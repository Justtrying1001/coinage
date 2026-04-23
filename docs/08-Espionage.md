# Espionage (Coinage runtime MVP)

## Scope
This document describes the implemented **MVP-final espionage loop** in Coinage runtime.

## Core model
- Espionage is funded by silver in the city spy vault (`spyVaultSilver`).
- Silver is deposited by converting city iron.
- Minimum launch amount: **1000 silver**.
- One active outgoing mission per source city.
- While an outgoing mission is active, vault refill is blocked.

## Building and prerequisites
- Operational gate building: `intelligence_center`.
- Runtime unlock for building progression: `HQ 10`, `market 4`, `warehouse 7`.
- Vault capacity scales with intelligence center level:
  - level `N`: `N * 1000`
  - level `10`: infinite capacity.

## Mission targeting and launch
- Launch requires:
  - non-empty target city id,
  - target different from source city,
  - source city has `intelligence_center >= 1`,
  - enough vault silver (`>= sent amount`),
  - minimum sent silver (`>= 1000`),
  - target city must exist in persisted map.
- If target city does not exist, mission is rejected explicitly (`Target city not found`).

## Travel and resolution
- Mission travel is currently fixed at **15 minutes** (`ESPIONAGE_TRAVEL_MS`).
- Global resolution is processed by the central economy runtime tick (`runCityEconomyRuntimeTick`) and no longer depends on city-load side effects.
- `CoinageRenderApp` calls the economy runtime tick continuously, so due missions resolve even while the player is in galaxy/planet/city views.

### Defense formula
- Success rule: `attackerSentSilver > defenderEffectiveSpyDefense`.
- `defenderEffectiveSpyDefense` uses defender vault silver and derived intelligence stats:
  - derived `detectionPct`
  - derived `counterIntelPct`
- Those derived stats include contributions from building/research/policy where applicable.

## Outcome rules
### Success
- Attacker receives `attack_success` report.
- Report includes reconnaissance snapshot:
  - target resources,
  - target building levels,
  - target troops,
  - target defensive bonuses (`cityDefensePct`, `antiAirDefensePct`, `detectionPct`, `counterIntelPct`).
- Defender receives **no report by default** on success.
- Defender vault silver is not consumed on success.

### Failure
- Attacker receives `attack_failed` report.
- Defender receives `defense_failed_attempt` report.
- Defender vault silver is reduced by `min(defenderVaultSilver, attackerSentSilver)`.

## Report storage
- Reports are persisted in `espionageReports` per city.
- Feed is capped to latest 20 reports.

## Notes
- Legacy research id `signals_intel` is mapped to `cryptography` for old saves.
- No additional espionage resource is introduced beyond vault silver.

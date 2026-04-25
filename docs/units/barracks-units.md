# Barracks Units Reference (Naming + Transport Capacity Canonical)

Last update: 2026-04-22
Scope: `line_infantry`, `phalanx_lanceguard`, `rail_marksman`, `assault_legionnaire`, `aegis_shieldguard`, `raider_hoverbike`, `siege_breacher`.

## Source of truth
- Runtime/config: `src/game/city/economy/cityEconomyConfig.ts`
- Runtime training flow: `src/game/city/economy/cityEconomySystem.ts`
- UI display: `src/game/render/modes/CityFoundationMode.ts`
- Tests: `src/game/city/economy/cityEconomySystem.test.ts`

Rule: technical ids stay unchanged; display names come from `CITY_ECONOMY_CONFIG.troops[*].name`.

## Barracks units (current canonical names)

| Unit ID | Display name | Required building | Building lvl | Required research | Transport capacity (canonical transport+pillage) | Runtime wiring status | Visual status |
|---|---|---|---:|---|---:|---|---|
| line_infantry | Frontline Trooper | barracks | 1 | none | 16 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |
| phalanx_lanceguard | Bulwark Trooper | barracks | 1 | bulwark_trooper | 8 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |
| rail_marksman | Railgun Skirmisher | barracks | 1 | railgun_skirmisher | 8 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |
| assault_legionnaire | Assault Ranger | barracks | 1 | assault_ranger | 24 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |
| aegis_shieldguard | Aegis Walker | barracks | 1 | aegis_walker | 64 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |
| raider_hoverbike | Raider Interceptor | barracks | 10 | raider_interceptor | 72 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |
| siege_breacher | Siege Artillery | barracks | 5 | siege_artillery | 400 | training guards/queue/resolve OK; transport/pillage NOT WIRED | MISSING |

## Notes
- `transportCapacity` is now the only canonical stat for transport and pillage semantics in troop config.
- Legacy troop loot stat is removed from troop model/config.
- Current local runtime still does not execute a dedicated pillage/transport mechanic; value is canonical data, not yet consumed in combat/raid resolution.

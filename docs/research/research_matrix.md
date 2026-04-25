# Research Matrix — Runtime Ground Truth

## Sources of truth
- `CITY_ECONOMY_CONFIG.research` (canonical IDs and display names).
- `CITY_ECONOMY_CONFIG.troops[*].requiredResearch` (unit unlock mapping).
- `requiredResearchForIntelProject` + `canStartEspionageMission` (feature gates).
- `LEGACY_RESEARCH_ID_MAP` (load-time compatibility only).

## Canonical research table
| technical id | display name | lab lvl | RP | cost O/S/I | duration(s) | prerequisites | effect/unlock (code-proven) | type | status |
|---|---|---:|---:|---|---:|---|---|---|---|
| `railgun_skirmisher` | Railgun Skirmisher | 1 | 4 | 300/500/200 | 570 | none | unit `rail_marksman` (Railgun Skirmisher); no direct effect | unit unlock | live |
| `assault_ranger` | Assault Ranger | 1 | 8 | 550/100/400 | 810 | none | unit `assault_legionnaire` (Assault Ranger); no direct effect | unit unlock | live |
| `city_guard` | City Guard | 1 | 3 | 400/300/300 | 510 | none | effect {defensePct: 5} | direct bonus | partial (aggregated into cityDefensePct) |
| `bulwark_trooper` | Bulwark Trooper | 4 | 8 | 600/200/850 | 1080 | railgun_skirmisher | unit `phalanx_lanceguard` (Bulwark Trooper); no direct effect | unit unlock | live |
| `diplomacy` | Diplomacy | 4 | 3 | 100/400/200 | 780 | city_guard | effect {productionPct: 10} | direct bonus | live |
| `meteorology` | Meteorology | 4 | 4 | 2500/1700/6500 | 840 | assault_ranger | effect {trainingSpeedPct: 5} | direct bonus | live |
| `espionage` | Espionage | 7 | 3 | 900/900/1100 | 1050 | diplomacy | Espionage mission; Intel project: network; effect {detectionPct: 10, counterIntelPct: 10} | feature unlock | live |
| `market_logistics` | Market Logistics | 7 | 3 | 1200/1200/1200 | 1050 | diplomacy | effect {marketEfficiencyPct: 6} | direct bonus | partial (aggregated + UI surfaced; no active trade subsystem consumer) |
| `ceramics` | Ceramics | 7 | 4 | 700/1500/900 | 1110 | city_guard | effect {marketEfficiencyPct: 4} | direct bonus | partial (aggregated + UI surfaced; no active trade subsystem consumer) |
| `workforce_loyalty` | Workforce Loyalty | 7 | 6 | 1300/1300/1300 | 1230 | ceramics | effect {productionPct: 12} | direct bonus | live |
| `raider_interceptor` | Raider Interceptor | 10 | 8 | 1400/700/1800 | 1620 | bulwark_trooper | unit `raider_hoverbike` (Raider Interceptor); no direct effect | unit unlock | live |
| `architecture` | Architecture | 10 | 6 | 1900/2100/1300 | 1500 | city_guard | effect {buildSpeedPct: 6} | direct bonus | live |
| `trainer` | Trainer | 10 | 4 | 800/1300/1600 | 1380 | meteorology | effect {trainingSpeedPct: 8} | direct bonus | live |
| `colony_ark` | Colony Ark | 13 | 0 | 7500/7500/9500 | 3600 | architecture | unit `colonization_arkship` (Colony Ark); no direct effect | unit unlock | live |
| `sentinel_interceptor` | Sentinel Interceptor | 13 | 8 | 2800/1300/2200 | 1890 | trainer | unit `interceptor_sentinel` (Sentinel Interceptor); no direct effect | unit unlock | live |
| `crane` | Crane | 13 | 4 | 3000/1800/1400 | 1650 | architecture | effect {buildSpeedPct: 8} | direct bonus | live |
| `shipwright` | Shipwright | 13 | 6 | 5000/2000/1900 | 1770 | trainer | effect {trainingSpeedPct: 10} | direct bonus | live |
| `aegis_walker` | Aegis Walker | 16 | 8 | 3700/1900/2800 | 2160 | raider_interceptor | unit `aegis_shieldguard` (Aegis Walker); no direct effect | unit unlock | live |
| `vanguard_corvette` | Vanguard Corvette | 16 | 8 | 4400/2000/2400 | 2160 | sentinel_interceptor | unit `rapid_escort` (Vanguard Corvette); no direct effect | unit unlock | live |
| `conscription` | Conscription | 16 | 4 | 3800/4200/6000 | 1920 | trainer | effect {trainingSpeedPct: 6, defensePct: 4} | direct bonus | partial (training live; defense aggregated into cityDefensePct) |
| `ember_frigate` | Ember Frigate | 19 | 8 | 5300/2600/2700 | 2430 | vanguard_corvette | unit `ember_drifter` (Ember Frigate); no direct effect | unit unlock | live |
| `siege_artillery` | Siege Artillery | 19 | 8 | 5500/2900/3600 | 2430 | architecture | unit `siege_breacher` (Siege Artillery); no direct effect | unit unlock | live |
| `cryptography` | Cryptography | 19 | 6 | 2500/3000/5100 | 2310 | espionage | Intel project: cipher; effect {counterIntelPct: 12} | feature unlock | live |
| `democracy` | Democracy | 19 | 6 | 3100/3100/4100 | 2310 | workforce_loyalty | effect {defensePct: 8} | direct bonus | partial (aggregated into cityDefensePct) |
| `rapid_carrier` | Rapid Carrier | 22 | 8 | 6500/2800/3200 | 2700 | sentinel_interceptor | unit `swift_carrier` (Rapid Carrier); no direct effect | unit unlock | live |
| `plow` | Plow | 22 | 4 | 3000/3300/2100 | 2460 | ceramics | effect {productionPct: 10} | direct bonus | live |
| `bunks` | Bunks | 22 | 6 | 8900/5200/7800 | 2580 | rapid_carrier | effect {defensePct: 6} | direct bonus | partial (aggregated into cityDefensePct) |
| `bulwark_cruiser` | Bulwark Cruiser | 25 | 8 | 6500/3800/4700 | 2970 | sentinel_interceptor, vanguard_corvette | unit `bulwark_trireme` (Bulwark Cruiser); no direct effect | unit unlock | live |
| `defense_formation` | Defense Formation | 25 | 9 | 4000/4000/15000 | 3030 | city_guard, bulwark_trooper | effect {defensePct: 10} | direct bonus | partial (aggregated into cityDefensePct) |
| `offensive_tempo` | Offensive Tempo | 25 | 6 | 8000/8000/9000 | 2850 | siege_artillery | effect {trainingSpeedPct: 6} | direct bonus | live |
| `mathematics` | Mathematics | 25 | 6 | 7100/4400/8600 | 2850 | architecture | effect {buildSpeedPct: 6} | direct bonus | live |
| `fortification_breach` | Fortification Breach | 28 | 10 | 7900/9200/14000 | 3360 | siege_artillery | effect {defensePct: 4} | direct bonus | partial (aggregated into cityDefensePct) |
| `cartography` | Cartography | 28 | 8 | 10000/6700/12500 | 3240 | rapid_carrier | effect {marketEfficiencyPct: 4} | direct bonus / prerequisite gate | partial (aggregated + used as prerequisite; no standalone feature gate consumer) |
| `conquest` | Conquest | 28 | 0 | 12000/12000/16000 | 4200 | colony_ark, cartography | no direct effect | prerequisite gate only | partial (consumed as prerequisite; no standalone active subsystem gate) |
| `anti_air_defense` | Anti-Air Defense | 31 | 4 | 8500/5900/6600 | 3270 | siege_artillery | effect {antiAirDefensePct: 8} | direct bonus | partial (aggregated + surfaced; no dedicated active anti-air combat resolver in this runtime) |
| `recovery_logistics` | Recovery Logistics | 31 | 6 | 9200/5300/10000 | 3390 | conquest | effect {marketEfficiencyPct: 5} | direct bonus | partial (aggregated + UI surfaced; no active trade subsystem consumer) |
| `command_selection` | Command Selection | 31 | 10 | 10000/8000/12000 | 3630 | democracy | effect {buildSpeedPct: 4, defensePct: 4} | direct bonus | partial (build speed live; defense aggregated into cityDefensePct) |
| `veteran_training` | Veteran Training | 34 | 6 | 9800/11400/14200 | 3660 | defense_formation | effect {trainingSpeedPct: 6, defensePct: 6} | direct bonus | partial (training live; defense aggregated into cityDefensePct) |
| `workforce_morale` | Workforce Morale | 34 | 4 | 8000/6500/11000 | 3540 | workforce_loyalty | effect {productionPct: 6} | direct bonus | live |
| `naval_mobilization` | Naval Mobilization | 34 | 8 | 13000/9700/15500 | 3780 | bulwark_cruiser, cartography | effect {trainingSpeedPct: 4} | direct bonus | live |

## Consumption notes (runtime-grounded)
- `defensePct` effects are aggregated into `cityDefensePct` and exposed in derived stats/UI; no broader battle engine integration is claimed in this runtime slice.
- `antiAirDefensePct` is aggregated and surfaced (including intel snapshots), but no dedicated anti-air combat resolver is currently active here.
- `marketEfficiencyPct` is aggregated and surfaced in UI/derived stats; no standalone trading execution subsystem consumer is active in this runtime slice.
- `conquest` and `cartography` are consumed as research prerequisites; no standalone gameplay gate function currently checks them directly.

## Legacy compatibility mapping (load/hydration only)
| legacy id | canonical id |
|---|---|
| `slinger` | `railgun_skirmisher` |
| `archer` | `assault_ranger` |
| `hoplite` | `bulwark_trooper` |
| `horseman` | `raider_interceptor` |
| `chariot` | `aegis_walker` |
| `catapult` | `siege_artillery` |
| `bireme` | `sentinel_interceptor` |
| `light_ship` | `vanguard_corvette` |
| `fire_ship` | `ember_frigate` |
| `trireme` | `bulwark_cruiser` |
| `light_transport_ships` | `rapid_carrier` |
| `colony_ship` | `colony_ark` |
| `booty` | `market_logistics` |
| `villagers_loyalty` | `workforce_loyalty` |
| `phalanx` | `defense_formation` |
| `breakthrough` | `offensive_tempo` |
| `ram` | `fortification_breach` |
| `stone_hail` | `anti_air_defense` |
| `temple_looting` | `recovery_logistics` |
| `divine_selection` | `command_selection` |
| `battle_experience` | `veteran_training` |
| `strong_wine` | `workforce_morale` |
| `set_sail` | `naval_mobilization` |
| `signals_intel` | `cryptography` |

# Reference Research (Coinage)

## 1) Source of truth runtime

- `src/game/city/economy/cityEconomyConfig.ts` (research IDs, coûts, RP, prérequis, unlocks troupes).
- `src/game/city/economy/cityEconomySystem.ts` (gating, dépense RP, completion instantanée).
- `src/game/city/economy/cityEconomyPersistence.ts` (migration legacy IDs).
- `src/game/city/economy/cityBuildingLevelTables.ts` (table complète `research_lab`).

## 2) Research Lab (Academy-equivalent Coinage)

- Building ID: `research_lab`
- Unlock HQ: `8`
- Prérequis: `housing_complex >= 6`, `barracks >= 5`
- Max level: `36`
- Règle RP runtime: `4 RP par niveau research_lab` (capacité RP = `level * 4`)
- Effet bâtiment par niveau: `researchCapacity: +4`

| Lvl | ore | stone | iron | buildSeconds | populationCost | researchCapacity |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 100 | 200 | 120 | 107 | 3 | 4 |
| 2 | 231 | 429 | 276 | 509 | 6 | 4 |
| 3 | 378 | 670 | 448 | 1266 | 9 | 4 |
| 4 | 535 | 919 | 633 | 2419 | 12 | 4 |
| 5 | 701 | 1175 | 828 | 3997 | 15 | 4 |
| 6 | 874 | 1435 | 1030 | 6024 | 18 | 4 |
| 7 | 1053 | 1701 | 1240 | 8522 | 21 | 4 |
| 8 | 1238 | 1970 | 1455 | 11508 | 24 | 4 |
| 9 | 1428 | 2242 | 1676 | 15000 | 27 | 4 |
| 10 | 1622 | 2518 | 1902 | 19013 | 30 | 4 |
| 11 | 1820 | 2796 | 2132 | 23799 | 33 | 4 |
| 12 | 2022 | 3077 | 2367 | 26533 | 36 | 4 |
| 13 | 2228 | 3360 | 2606 | 29326 | 39 | 4 |
| 14 | 2437 | 3646 | 2848 | 32172 | 42 | 4 |
| 15 | 2649 | 3933 | 3094 | 35070 | 45 | 4 |
| 16 | 2864 | 4222 | 3343 | 38016 | 48 | 4 |
| 17 | 3082 | 4514 | 3595 | 41009 | 51 | 4 |
| 18 | 3303 | 4807 | 3850 | 44046 | 54 | 4 |
| 19 | 3526 | 5101 | 4109 | 47126 | 57 | 4 |
| 20 | 3752 | 5397 | 4369 | 50246 | 60 | 4 |
| 21 | 3980 | 5695 | 4633 | 53407 | 63 | 4 |
| 22 | 4210 | 5994 | 4899 | 56603 | 66 | 4 |
| 23 | 4443 | 6294 | 5167 | 59838 | 69 | 4 |
| 24 | 4678 | 6596 | 5438 | 63108 | 72 | 4 |
| 25 | 4915 | 6899 | 5711 | 66411 | 75 | 4 |
| 26 | 5154 | 7203 | 5986 | 69748 | 78 | 4 |
| 27 | 5394 | 7508 | 6264 | 73117 | 81 | 4 |
| 28 | 5637 | 7815 | 6543 | 76518 | 84 | 4 |
| 29 | 5882 | 8122 | 6824 | 79949 | 87 | 4 |
| 30 | 6128 | 8431 | 7108 | 83410 | 90 | 4 |
| 31 | 6376 | 8740 | 7393 | 86900 | 93 | 4 |
| 32 | 6626 | 9051 | 7680 | 90418 | 96 | 4 |
| 33 | 6877 | 9363 | 7969 | 93964 | 99 | 4 |
| 34 | 7130 | 9675 | 8260 | 97536 | 102 | 4 |
| 35 | 7385 | 9989 | 8552 | 101135 | 105 | 4 |
| 36 | 7641 | 10303 | 8846 | 104760 | 108 | 4 |

## 3) Fonctionnement du système research (runtime actuel)

- Local à la ville (state city economy).
- Une recherche est **instantanée** après validation des guards (pas de timer arbitraire).
- Guards: déjà complétée ? niveau `research_lab` suffisant ? RP disponibles ? ressources suffisantes ?
- Coût RP consommé = somme des `researchPointsCost` des recherches complétées.
- Enforcement unlock troupes par `requiredResearch` est activé (`troopResearchEnforcementEnabled = true`).
- `researchQueue` est conservé en structure de persistence mais non utilisé pour un timer research.
- Migration legacy: `economy_drills`->`diplomacy`, `fortified_districts`->`city_guard`, `logistics_automation`->`booty`, `signals_intel`->`espionage`, `war_protocols`->`meteorology`.

## 4) Catalogue complet des recherches

| ID | Nom | research_lab min lvl | RP | ore | stone | iron | Effet runtime |
|---|---|---:|---:|---:|---:|---:|---|
| `slinger` | Slinger Drill | 1 | 4 | 300 | 500 | 200 | `—` |
| `archer` | Archer Doctrine | 1 | 8 | 550 | 100 | 400 | `—` |
| `city_guard` | City Guard | 1 | 3 | 400 | 300 | 300 | `defensePct: 5` |
| `hoplite` | Hoplite Formation | 4 | 8 | 600 | 200 | 850 | `—` |
| `diplomacy` | Diplomacy | 4 | 3 | 100 | 400 | 200 | `productionPct: 15` |
| `meteorology` | Meteorology | 4 | 4 | 2500 | 1700 | 6500 | `trainingSpeedPct: 10` |
| `espionage` | Espionage | 7 | 3 | 900 | 900 | 1100 | `detectionPct: 20, counterIntelPct: 20` |
| `booty` | Booty Routing | 7 | 3 | 1200 | 1200 | 1200 | `marketEfficiencyPct: 8` |
| `ceramics` | Ceramics Stockpiles | 7 | 4 | 700 | 1500 | 900 | `—` |
| `villagers_loyalty` | Villager's Loyalty | 7 | 6 | 1300 | 1300 | 1300 | `productionPct: 15` |
| `horseman` | Horseman Tactics | 10 | 8 | 1400 | 700 | 1800 | `—` |
| `architecture` | Architecture | 10 | 6 | 1900 | 2100 | 1300 | `—` |
| `trainer` | Trainer Corps | 10 | 4 | 800 | 1300 | 1600 | `trainingSpeedPct: 10` |
| `colony_ship` | Colony Convoy Doctrine | 13 | 0 | 7500 | 7500 | 9500 | `—` |
| `bireme` | Bireme Hulls | 13 | 8 | 2800 | 1300 | 2200 | `—` |
| `crane` | Crane Logistics | 13 | 4 | 3000 | 1800 | 1400 | `—` |
| `shipwright` | Shipwright Training | 13 | 6 | 5000 | 2000 | 1900 | `trainingSpeedPct: 10` |
| `chariot` | Chariot Platform | 16 | 8 | 3700 | 1900 | 2800 | `—` |
| `light_ship` | Light Ship Doctrine | 16 | 8 | 4400 | 2000 | 2400 | `—` |
| `conscription` | Conscription | 16 | 4 | 3800 | 4200 | 6000 | `—` |
| `fire_ship` | Fire Ship Arsenal | 19 | 8 | 5300 | 2600 | 2700 | `—` |
| `catapult` | Catapult Siege | 19 | 8 | 5500 | 2900 | 3600 | `—` |
| `cryptography` | Cryptography | 19 | 6 | 2500 | 3000 | 5100 | `counterIntelPct: 10` |
| `democracy` | Democracy | 19 | 6 | 3100 | 3100 | 4100 | `defensePct: 10` |
| `light_transport_ships` | Light Transport Ships | 22 | 8 | 6500 | 2800 | 3200 | `—` |
| `plow` | Plow | 22 | 4 | 3000 | 3300 | 2100 | `—` |
| `bunks` | Bunks | 22 | 6 | 8900 | 5200 | 7800 | `—` |
| `trireme` | Trireme Blueprint | 25 | 8 | 6500 | 3800 | 4700 | `—` |
| `phalanx` | Phalanx | 25 | 9 | 4000 | 4000 | 15000 | `defensePct: 10` |
| `breakthrough` | Breakthrough | 25 | 6 | 8000 | 8000 | 9000 | `—` |
| `mathematics` | Mathematics | 25 | 6 | 7100 | 4400 | 8600 | `—` |
| `ram` | Ram | 28 | 10 | 7900 | 9200 | 14000 | `—` |
| `cartography` | Cartography | 28 | 8 | 10000 | 6700 | 12500 | `—` |
| `conquest` | Conquest | 28 | 0 | 12000 | 12000 | 16000 | `—` |
| `stone_hail` | Stone Hail | 31 | 4 | 8500 | 5900 | 6600 | `—` |
| `temple_looting` | Temple Looting | 31 | 6 | 9200 | 5300 | 10000 | `—` |
| `divine_selection` | Divine Selection | 31 | 10 | 10000 | 8000 | 12000 | `—` |
| `battle_experience` | Battle Experience | 34 | 6 | 9800 | 11400 | 14200 | `—` |
| `strong_wine` | Strong Wine | 34 | 4 | 8000 | 6500 | 11000 | `—` |
| `set_sail` | Set Sail | 34 | 8 | 13000 | 9700 | 15500 | `—` |

## 5) Unlocks/branches actuellement branchés côté troupes

| Troop ID | Bâtiment req | Lvl | Research req |
|---|---|---:|---|
| `phalanx_lancer` | `barracks` | 1 | `hoplite` |
| `marksman` | `barracks` | 1 | `archer` |
| `assault` | `barracks` | 1 | `city_guard` |
| `shield_guard` | `barracks` | 15 | `horseman` |
| `raider_cavalry` | `barracks` | 10 | `chariot` |
| `breacher` | `barracks` | 5 | `catapult` |
| `assault_convoy` | `space_dock` | 1 | `light_transport_ships` |
| `swift_carrier` | `space_dock` | 1 | `light_transport_ships` |
| `interception_sentinel` | `space_dock` | 1 | `bireme` |
| `ember_drifter` | `space_dock` | 1 | `light_ship` |
| `rapid_escort` | `space_dock` | 1 | `fire_ship` |
| `bulwark_trireme` | `space_dock` | 1 | `trireme` |
| `colonization_convoy` | `space_dock` | 10 | `colony_ship` |

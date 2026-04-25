# Research System Overview

## What the research system is
- Système de progression locale basé sur une file temporisée (`researchQueue`) et un stock de recherches complétées (`completedResearch`).
- Chaque recherche a: coût ressources, coût RP, durée, prereqs, et effet déclaré.

## What is implemented today
- Queue timed start/resolve, guards complets (prereqs, lab level, ressources, RP, queue busy).
- Persistence/load/migration legacy research IDs.
- Gating runtime des unlock unités et des features espionnage/intel.

## What is partially implemented
- Plusieurs effets sont surtout agrégés (defensePct, antiAirDefensePct, marketEfficiencyPct) sans consommateur gameplay complet prouvé dans ce scope.
- Branches cartography/recovery_logistics/naval_mobilization: cohérence design partiellement ambiguë.

## What is not implemented yet
- Système conquest/colonization global branché sur la research `conquest` (non prouvé runtime).
- Système trade/market runtime complet consommant explicitement `marketEfficiencyPct`.

## Research categories
- unit unlock
- production
- training
- construction
- defense
- espionage/intel
- market/logistics
- anti-air
- colonization/conquest

## Research truth matrix
| id | display name | category | effect | current consumer | status | doc link |
|---|---|---|---|---|---|---|
| `railgun_skirmisher` | Railgun Skirmisher | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (rail_marksman) | FULLY_WIRED | [railgun_skirmisher](./items/railgun_skirmisher.md) |
| `assault_ranger` | Assault Ranger | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (assault_legionnaire) | FULLY_WIRED | [assault_ranger](./items/assault_ranger.md) |
| `city_guard` | City Guard | stat bonus | `defensePct: 5` | getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé) | PARTIALLY_WIRED | [city_guard](./items/city_guard.md) |
| `bulwark_trooper` | Bulwark Trooper | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (phalanx_lanceguard) | FULLY_WIRED | [bulwark_trooper](./items/bulwark_trooper.md) |
| `diplomacy` | Diplomacy | stat bonus | `productionPct: 10` | getResearchEffectTotals -> getCityDerivedStats.productionPct -> getProductionPerHour/applyClaimOnAccess | FULLY_WIRED | [diplomacy](./items/diplomacy.md) |
| `meteorology` | Meteorology | stat bonus | `trainingSpeedPct: 5` | getResearchEffectTotals -> getCityDerivedStats.trainingSpeedPct -> startTroopTraining | FULLY_WIRED | [meteorology](./items/meteorology.md) |
| `espionage` | Espionage | feature gate | `detectionPct: 10, counterIntelPct: 10` | canStartEspionageMission + requiredResearchForIntelProject(network) + getDefenderEffectiveSpyDefense | FULLY_WIRED | [espionage](./items/espionage.md) |
| `market_logistics` | Market Logistics | stat bonus | `marketEfficiencyPct: 6` | getResearchEffectTotals -> getCityDerivedStats.marketEfficiencyPct (UI/derived) | PARTIALLY_WIRED | [market_logistics](./items/market_logistics.md) |
| `ceramics` | Ceramics | stat bonus | `marketEfficiencyPct: 4` | getResearchEffectTotals -> getCityDerivedStats.marketEfficiencyPct (UI/derived) | PARTIALLY_WIRED | [ceramics](./items/ceramics.md) |
| `workforce_loyalty` | Workforce Loyalty | stat bonus | `productionPct: 12` | getResearchEffectTotals -> getCityDerivedStats.productionPct -> getProductionPerHour/applyClaimOnAccess | FULLY_WIRED | [workforce_loyalty](./items/workforce_loyalty.md) |
| `raider_interceptor` | Raider Interceptor | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (raider_hoverbike) | FULLY_WIRED | [raider_interceptor](./items/raider_interceptor.md) |
| `architecture` | Architecture | stat bonus | `buildSpeedPct: 6` | getResearchEffectTotals -> getCityDerivedStats.buildSpeedPct -> getConstructionDurationSeconds | FULLY_WIRED | [architecture](./items/architecture.md) |
| `trainer` | Trainer | stat bonus | `trainingSpeedPct: 8` | getResearchEffectTotals -> getCityDerivedStats.trainingSpeedPct -> startTroopTraining | FULLY_WIRED | [trainer](./items/trainer.md) |
| `colony_ark` | Colony Ark | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (colonization_arkship) | PARTIALLY_WIRED | [colony_ark](./items/colony_ark.md) |
| `sentinel_interceptor` | Sentinel Interceptor | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (interceptor_sentinel) | FULLY_WIRED | [sentinel_interceptor](./items/sentinel_interceptor.md) |
| `crane` | Crane | stat bonus | `buildSpeedPct: 8` | getResearchEffectTotals -> getCityDerivedStats.buildSpeedPct -> getConstructionDurationSeconds | FULLY_WIRED | [crane](./items/crane.md) |
| `shipwright` | Shipwright | stat bonus | `trainingSpeedPct: 10` | getResearchEffectTotals -> getCityDerivedStats.trainingSpeedPct -> startTroopTraining | FULLY_WIRED | [shipwright](./items/shipwright.md) |
| `aegis_walker` | Aegis Walker | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (aegis_shieldguard) | FULLY_WIRED | [aegis_walker](./items/aegis_walker.md) |
| `vanguard_corvette` | Vanguard Corvette | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (rapid_escort) | FULLY_WIRED | [vanguard_corvette](./items/vanguard_corvette.md) |
| `conscription` | Conscription | mixed | `trainingSpeedPct: 6, defensePct: 4` | Effets mixtes: training/build consommés; defensePct seulement agrégé via cityDefensePct | PARTIALLY_WIRED | [conscription](./items/conscription.md) |
| `ember_frigate` | Ember Frigate | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (ember_drifter) | FULLY_WIRED | [ember_frigate](./items/ember_frigate.md) |
| `siege_artillery` | Siege Artillery | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (siege_breacher) | FULLY_WIRED | [siege_artillery](./items/siege_artillery.md) |
| `cryptography` | Cryptography | feature gate | `counterIntelPct: 12` | requiredResearchForIntelProject(cipher) + getDefenderEffectiveSpyDefense + evaluateEspionageOutcome | FULLY_WIRED | [cryptography](./items/cryptography.md) |
| `democracy` | Democracy | stat bonus | `defensePct: 8` | getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé) | PARTIALLY_WIRED | [democracy](./items/democracy.md) |
| `rapid_carrier` | Rapid Carrier | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (swift_carrier) | FULLY_WIRED | [rapid_carrier](./items/rapid_carrier.md) |
| `plow` | Plow | stat bonus | `productionPct: 10` | getResearchEffectTotals -> getCityDerivedStats.productionPct -> getProductionPerHour/applyClaimOnAccess | FULLY_WIRED | [plow](./items/plow.md) |
| `bunks` | Bunks | stat bonus | `defensePct: 6` | getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé) | PARTIALLY_WIRED | [bunks](./items/bunks.md) |
| `bulwark_cruiser` | Bulwark Cruiser | unit unlock | `{}` | canStartTroopTraining -> troop.requiredResearch (bulwark_trireme) | FULLY_WIRED | [bulwark_cruiser](./items/bulwark_cruiser.md) |
| `defense_formation` | Defense Formation | stat bonus | `defensePct: 10` | getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé) | PARTIALLY_WIRED | [defense_formation](./items/defense_formation.md) |
| `offensive_tempo` | Offensive Tempo | stat bonus | `trainingSpeedPct: 6` | getResearchEffectTotals -> getCityDerivedStats.trainingSpeedPct -> startTroopTraining | FULLY_WIRED | [offensive_tempo](./items/offensive_tempo.md) |
| `mathematics` | Mathematics | stat bonus | `buildSpeedPct: 6` | getResearchEffectTotals -> getCityDerivedStats.buildSpeedPct -> getConstructionDurationSeconds | FULLY_WIRED | [mathematics](./items/mathematics.md) |
| `fortification_breach` | Fortification Breach | stat bonus | `defensePct: 4` | getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé) | PARTIALLY_WIRED | [fortification_breach](./items/fortification_breach.md) |
| `cartography` | Cartography | mixed | `marketEfficiencyPct: 4` | marketEfficiency agrégé + prerequisite pour conquest/naval_mobilization | AMBIGUOUS | [cartography](./items/cartography.md) |
| `conquest` | Conquest | system gate | `{}` | Prerequisite pour recovery_logistics uniquement | DECLARED_BUT_FEATURE_NOT_IMPLEMENTED | [conquest](./items/conquest.md) |
| `anti_air_defense` | Anti-Air Defense | stat bonus | `antiAirDefensePct: 8` | getCityDerivedStats.antiAirDefensePct (UI + espionage snapshot) | PARTIALLY_WIRED | [anti_air_defense](./items/anti_air_defense.md) |
| `recovery_logistics` | Recovery Logistics | mixed | `marketEfficiencyPct: 5` | marketEfficiency agrégé + dépend de conquest | AMBIGUOUS | [recovery_logistics](./items/recovery_logistics.md) |
| `command_selection` | Command Selection | mixed | `buildSpeedPct: 4, defensePct: 4` | Effets mixtes: training/build consommés; defensePct seulement agrégé via cityDefensePct | PARTIALLY_WIRED | [command_selection](./items/command_selection.md) |
| `veteran_training` | Veteran Training | mixed | `trainingSpeedPct: 6, defensePct: 6` | Effets mixtes: training/build consommés; defensePct seulement agrégé via cityDefensePct | PARTIALLY_WIRED | [veteran_training](./items/veteran_training.md) |
| `workforce_morale` | Workforce Morale | stat bonus | `productionPct: 6` | getResearchEffectTotals -> getCityDerivedStats.productionPct -> getProductionPerHour/applyClaimOnAccess | FULLY_WIRED | [workforce_morale](./items/workforce_morale.md) |
| `naval_mobilization` | Naval Mobilization | stat bonus | `trainingSpeedPct: 4` | trainingSpeedPct via startTroopTraining; dépend cartography | PARTIALLY_WIRED | [naval_mobilization](./items/naval_mobilization.md) |

## Relationship with Research Lab
- Le Research Lab définit la capacité RP (`level * 4`) et conditionne l'accès aux recherches par niveau requis.
- Une seule recherche active simultanée est autorisée par guard runtime.

## Relationship with MVP scope
- Cœur research runtime: live.
- Intégration combat/trade/colonization: partielle ou absente selon branches.

## Important caveats
- Ne pas confondre effet déclaré en config et effet réellement consommé par un système gameplay actif.
- Plusieurs recherches sont aujourd'hui utiles surtout comme prereq chain ou stat agrégée.

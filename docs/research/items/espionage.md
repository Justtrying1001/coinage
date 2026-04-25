# Espionage

## Identity
- technical id: `espionage`
- display name: `Espionage`
- type: `feature gate`
- description: `Feature unlock research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.espionage`)

## Requirements
- required research lab level: `7`
- required research prerequisites: `diplomacy`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- Feature dependency: required to start espionage missions and intel network project.


## Costs
- ore: `900`
- stone: `900`
- iron: `1100`
- research points: `3`
- duration: `1050s`

## Declared effect
- `detectionPct: 10, counterIntelPct: 10`

## Intended role in the game
- intention design probable: Débloquer les actions d'espionnage et certains projets intel.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): canStartEspionageMission + requiredResearchForIntelProject(network) + getDefenderEffectiveSpyDefense
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Débloque espionnage + projet network + bonus detection/counterIntel.
- impact level: YES

## Status verdict
- `FULLY_WIRED`

## Problems / caveats
- Aucun gap majeur de wiring prouvé pour le scope runtime audité.

## Related systems
- Research queue
- City derived stats
- City research UI
- Persistence/hydration
- Intelligence projects
- Espionage mission system

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

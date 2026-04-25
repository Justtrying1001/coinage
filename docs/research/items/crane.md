# Crane

## Identity
- technical id: `crane`
- display name: `Crane`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.crane`)

## Requirements
- required research lab level: `13`
- required research prerequisites: `architecture`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `3000`
- stone: `1800`
- iron: `1400`
- research points: `4`
- duration: `1650s`

## Declared effect
- `buildSpeedPct: 8`

## Intended role in the game
- intention design probable: Accélérer les durées de construction.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.buildSpeedPct -> getConstructionDurationSeconds
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Réduit le temps de construction.
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

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

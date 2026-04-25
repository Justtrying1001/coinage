# Mathematics

## Identity
- technical id: `mathematics`
- display name: `Mathematics`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.mathematics`)

## Requirements
- required research lab level: `25`
- required research prerequisites: `architecture`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `7100`
- stone: `4400`
- iron: `8600`
- research points: `6`
- duration: `2850s`

## Declared effect
- `buildSpeedPct: 6`

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

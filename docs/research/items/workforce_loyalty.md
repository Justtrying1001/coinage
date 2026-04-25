# Workforce Loyalty

## Identity
- technical id: `workforce_loyalty`
- display name: `Workforce Loyalty`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.workforce_loyalty`)

## Requirements
- required research lab level: `7`
- required research prerequisites: `ceramics`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `1300`
- stone: `1300`
- iron: `1300`
- research points: `6`
- duration: `1230s`

## Declared effect
- `productionPct: 12`

## Intended role in the game
- intention design probable: Augmenter la production économique locale.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.productionPct -> getProductionPerHour/applyClaimOnAccess
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Augmente la production ressources réellement générée.
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

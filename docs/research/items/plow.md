# Plow

## Identity
- technical id: `plow`
- display name: `Plow`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.plow`)

## Requirements
- required research lab level: `22`
- required research prerequisites: `ceramics`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `3000`
- stone: `3300`
- iron: `2100`
- research points: `4`
- duration: `2460s`

## Declared effect
- `productionPct: 10`

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

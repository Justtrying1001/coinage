# Defense Formation

## Identity
- technical id: `defense_formation`
- display name: `Defense Formation`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.defense_formation`)

## Requirements
- required research lab level: `25`
- required research prerequisites: `city_guard`, `bulwark_trooper`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `4000`
- stone: `4000`
- iron: `15000`
- research points: `9`
- duration: `3030s`

## Declared effect
- `defensePct: 10`

## Intended role in the game
- intention design probable: Renforcer la défense de ville.
- confidence: `MEDIUM`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé)
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Augmente une stat défensive agrégée; pas de resolver combat global prouvé.
- impact level: PARTIAL

## Status verdict
- `PARTIALLY_WIRED`

## Problems / caveats
- Une partie de l'effet est consommée, mais pas l'ensemble de la promesse design probable.

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

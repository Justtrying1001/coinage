# Fortification Breach

## Identity
- technical id: `fortification_breach`
- display name: `Fortification Breach`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.fortification_breach`)

## Requirements
- required research lab level: `28`
- required research prerequisites: `siege_artillery`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `7900`
- stone: `9200`
- iron: `14000`
- research points: `10`
- duration: `3360s`

## Declared effect
- `defensePct: 4`

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

# Anti-Air Defense

## Identity
- technical id: `anti_air_defense`
- display name: `Anti-Air Defense`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.anti_air_defense`)

## Requirements
- required research lab level: `31`
- required research prerequisites: `siege_artillery`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `8500`
- stone: `5900`
- iron: `6600`
- research points: `4`
- duration: `3270s`

## Declared effect
- `antiAirDefensePct: 8`

## Intended role in the game
- intention design probable: Defensive anti-air layer reinforcement
- confidence: `MEDIUM`

## Current runtime behavior
- runtime consumer(s): getCityDerivedStats.antiAirDefensePct (UI + espionage snapshot)
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Stat anti-air agrégée sans resolver anti-air dédié prouvé.
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

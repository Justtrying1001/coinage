# Ceramics

## Identity
- technical id: `ceramics`
- display name: `Ceramics`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.ceramics`)

## Requirements
- required research lab level: `7`
- required research prerequisites: `city_guard`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `700`
- stone: `1500`
- iron: `900`
- research points: `4`
- duration: `1110s`

## Declared effect
- `marketEfficiencyPct: 4`

## Intended role in the game
- intention design probable: Economic storage/market handling improvement bucket
- confidence: `LOW`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.marketEfficiencyPct (UI/derived)
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Stat market agrégée, pas de système trade runtime prouvé.
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
- Market/logistics derived stat

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

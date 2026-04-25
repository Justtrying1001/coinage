# Cartography

## Identity
- technical id: `cartography`
- display name: `Cartography`
- type: `mixed`
- description: `Feature unlock research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.cartography`)

## Requirements
- required research lab level: `28`
- required research prerequisites: `rapid_carrier`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `10000`
- stone: `6700`
- iron: `12500`
- research points: `8`
- duration: `3240s`

## Declared effect
- `marketEfficiencyPct: 4`

## Intended role in the game
- intention design probable: Improve naval movement/logistics for expansion routes (Grepolis signal: ship speed)
- confidence: `MEDIUM`

## Current runtime behavior
- runtime consumer(s): marketEfficiency agrégé + prerequisite pour conquest/naval_mobilization
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Impact direct ambigu: bonus market agrégé + rôle de chaîne prereq.
- impact level: PARTIAL

## Status verdict
- `AMBIGUOUS`

## Problems / caveats
- Mapping design/runtime ambigu: impossible de conclure sans clarification produit explicite.

## Related systems
- Research queue
- City derived stats
- City research UI
- Persistence/hydration
- Colonization/Conquest branch
- Naval/logistics branch
- Market/logistics derived stat

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

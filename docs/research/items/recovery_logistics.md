# Recovery Logistics

## Identity
- technical id: `recovery_logistics`
- display name: `Recovery Logistics`
- type: `mixed`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.recovery_logistics`)

## Requirements
- required research lab level: `31`
- required research prerequisites: `conquest`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `9200`
- stone: `5300`
- iron: `10000`
- research points: `6`
- duration: `3390s`

## Declared effect
- `marketEfficiencyPct: 5`

## Intended role in the game
- intention design probable: Post-conquest/logistics efficiency boost
- confidence: `LOW`

## Current runtime behavior
- runtime consumer(s): marketEfficiency agrégé + dépend de conquest
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Impact direct ambigu tant que subsystem logistics/trade absent.
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

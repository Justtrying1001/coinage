# Conquest

## Identity
- technical id: `conquest`
- display name: `Conquest`
- type: `system gate`
- description: `System gate research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.conquest`)

## Requirements
- required research lab level: `28`
- required research prerequisites: `colony_ark`, `cartography`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- Feature dependency: parent conquest/colonization gameplay loop not implemented in audited runtime scope.


## Costs
- ore: `12000`
- stone: `12000`
- iron: `16000`
- research points: `0`
- duration: `4200s`

## Declared effect
- `{}`

## Intended role in the game
- intention design probable: Enable city takeover / conquest flow after colony setup
- confidence: `MEDIUM`

## Current runtime behavior
- runtime consumer(s): Prerequisite pour recovery_logistics uniquement
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Aucun système conquest/colonization runtime actif prouvé.
- impact level: NO/PENDING_FEATURE

## Status verdict
- `DECLARED_BUT_FEATURE_NOT_IMPLEMENTED`

## Problems / caveats
- La recherche est déclarée, mais le système mère attendu n'est pas présent.

## Related systems
- Research queue
- City derived stats
- City research UI
- Persistence/hydration
- Colonization/Conquest branch
- Naval/logistics branch

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

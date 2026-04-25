# Cryptography

## Identity
- technical id: `cryptography`
- display name: `Cryptography`
- type: `feature gate`
- description: `Feature unlock research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.cryptography`)

## Requirements
- required research lab level: `19`
- required research prerequisites: `espionage`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- Feature dependency: required to start intel cipher project.


## Costs
- ore: `2500`
- stone: `3000`
- iron: `5100`
- research points: `6`
- duration: `2310s`

## Declared effect
- `counterIntelPct: 12`

## Intended role in the game
- intention design probable: Débloquer des capacités de contre-espionnage avancées (cipher).
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): requiredResearchForIntelProject(cipher) + getDefenderEffectiveSpyDefense + evaluateEspionageOutcome
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Débloque projet cipher + renforce contre-espionnage.
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
- Intelligence projects
- Espionage mission system

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

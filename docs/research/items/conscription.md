# Conscription

## Identity
- technical id: `conscription`
- display name: `Conscription`
- type: `mixed`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.conscription`)

## Requirements
- required research lab level: `16`
- required research prerequisites: `trainer`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `3800`
- stone: `4200`
- iron: `6000`
- research points: `4`
- duration: `1920s`

## Declared effect
- `trainingSpeedPct: 6, defensePct: 4`

## Intended role in the game
- intention design probable: Accélérer l'entraînement et renforcer la défense agrégée de la ville.
- confidence: `MEDIUM`

## Current runtime behavior
- runtime consumer(s): Effets mixtes: training/build consommés; defensePct seulement agrégé via cityDefensePct
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Impact partiel selon sous-effet.
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

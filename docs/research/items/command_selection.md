# Command Selection

## Identity
- technical id: `command_selection`
- display name: `Command Selection`
- type: `mixed`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.command_selection`)

## Requirements
- required research lab level: `31`
- required research prerequisites: `democracy`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `10000`
- stone: `8000`
- iron: `12000`
- research points: `10`
- duration: `3630s`

## Declared effect
- `buildSpeedPct: 4, defensePct: 4`

## Intended role in the game
- intention design probable: Accélérer la construction et améliorer une défense agrégée.
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

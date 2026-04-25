# Offensive Tempo

## Identity
- technical id: `offensive_tempo`
- display name: `Offensive Tempo`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.offensive_tempo`)

## Requirements
- required research lab level: `25`
- required research prerequisites: `siege_artillery`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `8000`
- stone: `8000`
- iron: `9000`
- research points: `6`
- duration: `2850s`

## Declared effect
- `trainingSpeedPct: 6`

## Intended role in the game
- intention design probable: Accélérer la vitesse d'entraînement des unités.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.trainingSpeedPct -> startTroopTraining
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Réduit le temps d'entraînement dans la queue.
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

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`

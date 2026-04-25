# Naval Mobilization

## Identity
- technical id: `naval_mobilization`
- display name: `Naval Mobilization`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.naval_mobilization`)

## Requirements
- required research lab level: `34`
- required research prerequisites: `bulwark_cruiser`, `cartography`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `13000`
- stone: `9700`
- iron: `15500`
- research points: `8`
- duration: `3780s`

## Declared effect
- `trainingSpeedPct: 4`

## Intended role in the game
- intention design probable: Accélérer la vitesse d'entraînement des unités.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): trainingSpeedPct via startTroopTraining; dépend cartography
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Accélère training (y compris naval) mais branche design cartography ambiguë.
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

# Unités

Documentation alignée sur le runtime (`src/game/city/economy/cityEconomyConfig.ts` et `src/game/city/economy/cityEconomySystem.ts`).

## Vue d’ensemble

| ID | Nom affiché | Catégorie | Bâtiment de production | Niveau bâtiment requis | ore | stone | iron | trainingSeconds | populationCost | Notes |
|---|---|---|---|---:|---:|---:|---:|---:|---:|---|
| infantry | Infantry | ground | barracks | 1 | 28 | 20 | 0 | 20 | 1 | valeurs runtime |
| shield_guard | Shield Guard | ground | barracks | 5 | 58 | 50 | 12 | 40 | 2 | valeurs runtime |
| marksman | Marksman | ground | barracks | 10 | 82 | 52 | 34 | 50 | 2 | valeurs runtime |
| raider_cavalry | Raider Cavalry | ground | barracks | 15 | 122 | 86 | 54 | 70 | 3 | valeurs runtime |
| assault | Assault | ground | armament_factory | 1 | 145 | 108 | 90 | 85 | 3 | valeurs runtime |
| breacher | Breacher | ground | armament_factory | 5 | 210 | 180 | 135 | 115 | 4 | valeurs runtime |
| interception_sentinel | Interception Sentinel | air | space_dock | 1 | 178 | 132 | 130 | 95 | 3 | valeurs runtime |
| rapid_escort | Rapid Escort | air | space_dock | 5 | 235 | 170 | 170 | 120 | 3 | valeurs runtime |

## Regroupement par famille

### ground

| ID | Nom | Bâtiment | Niveau requis | ore | stone | iron | trainingSeconds | populationCost |
|---|---|---|---:|---:|---:|---:|---:|---:|
| infantry | Infantry | barracks | 1 | 28 | 20 | 0 | 20 | 1 |
| shield_guard | Shield Guard | barracks | 5 | 58 | 50 | 12 | 40 | 2 |
| marksman | Marksman | barracks | 10 | 82 | 52 | 34 | 50 | 2 |
| raider_cavalry | Raider Cavalry | barracks | 15 | 122 | 86 | 54 | 70 | 3 |
| assault | Assault | armament_factory | 1 | 145 | 108 | 90 | 85 | 3 |
| breacher | Breacher | armament_factory | 5 | 210 | 180 | 135 | 115 | 4 |

### air

| ID | Nom | Bâtiment | Niveau requis | ore | stone | iron | trainingSeconds | populationCost |
|---|---|---|---:|---:|---:|---:|---:|---:|
| interception_sentinel | Interception Sentinel | space_dock | 1 | 178 | 132 | 130 | 95 | 3 |
| rapid_escort | Rapid Escort | space_dock | 5 | 235 | 170 | 170 | 120 | 3 |

## Détail par unité

### Infantry
- **id**: `infantry`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 1`
- **coûts**: ore=28, stone=20, iron=0
- **temps d’entraînement**: 20 secondes
- **coût en population**: 1
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Shield Guard
- **id**: `shield_guard`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 5`
- **coûts**: ore=58, stone=50, iron=12
- **temps d’entraînement**: 40 secondes
- **coût en population**: 2
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Marksman
- **id**: `marksman`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 10`
- **coûts**: ore=82, stone=52, iron=34
- **temps d’entraînement**: 50 secondes
- **coût en population**: 2
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Raider Cavalry
- **id**: `raider_cavalry`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 15`
- **coûts**: ore=122, stone=86, iron=54
- **temps d’entraînement**: 70 secondes
- **coût en population**: 3
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Assault
- **id**: `assault`
- **catégorie**: `ground`
- **bâtiment de production**: `armament_factory`
- **prérequis runtime**: `armament_factory >= 1`
- **coûts**: ore=145, stone=108, iron=90
- **temps d’entraînement**: 85 secondes
- **coût en population**: 3
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Breacher
- **id**: `breacher`
- **catégorie**: `ground`
- **bâtiment de production**: `armament_factory`
- **prérequis runtime**: `armament_factory >= 5`
- **coûts**: ore=210, stone=180, iron=135
- **temps d’entraînement**: 115 secondes
- **coût en population**: 4
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Interception Sentinel
- **id**: `interception_sentinel`
- **catégorie**: `air`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1`
- **coûts**: ore=178, stone=132, iron=130
- **temps d’entraînement**: 95 secondes
- **coût en population**: 3
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Rapid Escort
- **id**: `rapid_escort`
- **catégorie**: `air`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 5`
- **coûts**: ore=235, stone=170, iron=170
- **temps d’entraînement**: 120 secondes
- **coût en population**: 3
- **autres stats runtime implémentées**: aucune stat de combat/logistique supplémentaire définie dans `TroopConfig`.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().


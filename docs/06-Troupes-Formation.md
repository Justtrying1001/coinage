# Unités

Documentation alignée sur le runtime (`src/game/city/economy/cityEconomyConfig.ts` et `src/game/city/economy/cityEconomySystem.ts`).

## Vue d’ensemble

| ID | Nom affiché | Catégorie | Bâtiment de production | Niveau bâtiment requis | Recherche requise | ore | stone | iron | favor | trainingSeconds | populationCost | attack | attackType | def blunt | def sharp | def distance | speed | booty | transport | Rôle |
|---|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---|
| citizen_militia | Citizen Militia | militia | housing_complex | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none | 6 | 8 | 4 | 0 | 0 | 0 | Emergency call-up defenders; not recruitable through standard queues. |
| infantry | Infantry | ground | barracks | 1 | — | 95 | 0 | 85 | 0 | 1080 | 1 | 5 | blunt | 14 | 8 | 30 | 8 | 16 | 0 | Frontline defensive infantry anchor. |
| phalanx_lancer | Phalanx Lancer | ground | barracks | 1 | hoplite | 0 | 75 | 150 | 0 | 1316 | 1 | 16 | sharp | 18 | 12 | 7 | 6 | 8 | 0 | Anti-blunt spear line. |
| marksman | Marksman | ground | barracks | 1 | archer | 55 | 100 | 40 | 0 | 1144 | 1 | 23 | distance | 7 | 8 | 2 | 14 | 8 | 0 | Ranged glass-cannon damage dealer. |
| assault | Assault | ground | barracks | 1 | city_guard | 120 | 0 | 75 | 0 | 1087 | 1 | 8 | distance | 7 | 25 | 13 | 12 | 24 | 0 | Ranged anti-sharp / utility profile. |
| shield_guard | Shield Guard | ground | barracks | 15 | horseman | 200 | 440 | 320 | 0 | 4710 | 4 | 56 | sharp | 76 | 16 | 56 | 18 | 64 | 0 | Elite heavy ground unit. |
| raider_cavalry | Raider Cavalry | ground | barracks | 10 | chariot | 240 | 120 | 360 | 0 | 3835 | 3 | 60 | blunt | 18 | 1 | 24 | 22 | 72 | 0 | Fast raider cavalry for burst and loot. |
| breacher | Breacher | ground | barracks | 5 | catapult | 700 | 700 | 700 | 0 | 17662 | 15 | 100 | distance | 30 | 30 | 30 | 2 | 400 | 0 | Slow siege platform with high structure pressure. |
| assault_convoy | Assault Convoy | naval | space_dock | 1 | light_transport_ships | 500 | 500 | 400 | 0 | 9600 | 7 | 0 | none | 0 | 0 | 0 | 8 | 0 | 26 | Standard transport ship. |
| swift_carrier | Swift Carrier | naval | space_dock | 1 | light_transport_ships | 800 | 0 | 400 | 0 | 7200 | 5 | 0 | none | 0 | 0 | 0 | 15 | 0 | 10 | Fast transport ship. |
| interception_sentinel | Interception Sentinel | naval | space_dock | 1 | bireme | 800 | 700 | 180 | 0 | 9900 | 8 | 24 | naval | 0 | 0 | 0 | 15 | 0 | 0 | Defensive interceptor ship. |
| ember_drifter | Ember Drifter | naval | space_dock | 1 | light_ship | 500 | 750 | 150 | 0 | 4000 | 8 | 0 | naval | 0 | 0 | 0 | 5 | 0 | 0 | Special defensive fire-ship role: each ship destroys one eligible enemy ship, then is destroyed. |
| rapid_escort | Rapid Escort | naval | space_dock | 1 | fire_ship | 1300 | 300 | 800 | 0 | 14400 | 10 | 200 | naval | 0 | 0 | 0 | 13 | 60 | 0 | Offensive naval ship. |
| bulwark_trireme | Bulwark Trireme | naval | space_dock | 1 | trireme | 2000 | 1300 | 1300 | 0 | 14400 | 16 | 250 | naval | 0 | 0 | 0 | 15 | 0 | 0 | Heavy naval ship. |
| colonization_convoy | Colonization Convoy | naval | space_dock | 10 | colony_ship | 10000 | 10000 | 10000 | 0 | 57535 | 170 | 0 | none | 0 | 0 | 0 | 3 | 0 | 0 | Colonization ship; consumed on successful city foundation/conquest and constrained by conquest travel rules. |

## Regroupement par famille

### militia

| ID | Nom | Bâtiment | Niveau requis | Recherche | ore | stone | iron | favor | trainingSeconds | populationCost | attack | type | defB | defS | defD | speed | booty | transport |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| citizen_militia | Citizen Militia | housing_complex | 0 | — | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none | 6 | 8 | 4 | 0 | 0 | 0 |

### ground

| ID | Nom | Bâtiment | Niveau requis | Recherche | ore | stone | iron | favor | trainingSeconds | populationCost | attack | type | defB | defS | defD | speed | booty | transport |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| infantry | Infantry | barracks | 1 | — | 95 | 0 | 85 | 0 | 1080 | 1 | 5 | blunt | 14 | 8 | 30 | 8 | 16 | 0 |
| phalanx_lancer | Phalanx Lancer | barracks | 1 | hoplite | 0 | 75 | 150 | 0 | 1316 | 1 | 16 | sharp | 18 | 12 | 7 | 6 | 8 | 0 |
| marksman | Marksman | barracks | 1 | archer | 55 | 100 | 40 | 0 | 1144 | 1 | 23 | distance | 7 | 8 | 2 | 14 | 8 | 0 |
| assault | Assault | barracks | 1 | city_guard | 120 | 0 | 75 | 0 | 1087 | 1 | 8 | distance | 7 | 25 | 13 | 12 | 24 | 0 |
| shield_guard | Shield Guard | barracks | 15 | horseman | 200 | 440 | 320 | 0 | 4710 | 4 | 56 | sharp | 76 | 16 | 56 | 18 | 64 | 0 |
| raider_cavalry | Raider Cavalry | barracks | 10 | chariot | 240 | 120 | 360 | 0 | 3835 | 3 | 60 | blunt | 18 | 1 | 24 | 22 | 72 | 0 |
| breacher | Breacher | barracks | 5 | catapult | 700 | 700 | 700 | 0 | 17662 | 15 | 100 | distance | 30 | 30 | 30 | 2 | 400 | 0 |

### naval

| ID | Nom | Bâtiment | Niveau requis | Recherche | ore | stone | iron | favor | trainingSeconds | populationCost | attack | type | defB | defS | defD | speed | booty | transport |
|---|---|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|
| assault_convoy | Assault Convoy | space_dock | 1 | light_transport_ships | 500 | 500 | 400 | 0 | 9600 | 7 | 0 | none | 0 | 0 | 0 | 8 | 0 | 26 |
| swift_carrier | Swift Carrier | space_dock | 1 | light_transport_ships | 800 | 0 | 400 | 0 | 7200 | 5 | 0 | none | 0 | 0 | 0 | 15 | 0 | 10 |
| interception_sentinel | Interception Sentinel | space_dock | 1 | bireme | 800 | 700 | 180 | 0 | 9900 | 8 | 24 | naval | 0 | 0 | 0 | 15 | 0 | 0 |
| ember_drifter | Ember Drifter | space_dock | 1 | light_ship | 500 | 750 | 150 | 0 | 4000 | 8 | 0 | naval | 0 | 0 | 0 | 5 | 0 | 0 |
| rapid_escort | Rapid Escort | space_dock | 1 | fire_ship | 1300 | 300 | 800 | 0 | 14400 | 10 | 200 | naval | 0 | 0 | 0 | 13 | 60 | 0 |
| bulwark_trireme | Bulwark Trireme | space_dock | 1 | trireme | 2000 | 1300 | 1300 | 0 | 14400 | 16 | 250 | naval | 0 | 0 | 0 | 15 | 0 | 0 |
| colonization_convoy | Colonization Convoy | space_dock | 10 | colony_ship | 10000 | 10000 | 10000 | 0 | 57535 | 170 | 0 | none | 0 | 0 | 0 | 3 | 0 | 0 |

## Détail par unité

### Citizen Militia
- **id**: `citizen_militia`
- **catégorie**: `militia`
- **bâtiment de production**: `housing_complex`
- **prérequis runtime**: `housing_complex >= 0`
- **coûts**: ore=0, stone=0, iron=0, favor=0
- **temps d’entraînement**: 0 secondes
- **coût en population**: 0
- **combat/logistique runtime**: attack=0 (none), defense=[blunt:6, sharp:8, distance:4], speed=0, booty=0, transport=0
- **statut spécial**: milice temporaire défensive locale, non recrutable via queue standard, activation 3h avec malus production -50%.
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Infantry
- **id**: `infantry`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 1`
- **coûts**: ore=95, stone=0, iron=85, favor=0
- **temps d’entraînement**: 1080 secondes
- **coût en population**: 1
- **combat/logistique runtime**: attack=5 (blunt), defense=[blunt:14, sharp:8, distance:30], speed=8, booty=16, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Phalanx Lancer
- **id**: `phalanx_lancer`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 1` + méta recherche `hoplite` (enforcement actif)
- **coûts**: ore=0, stone=75, iron=150, favor=0
- **temps d’entraînement**: 1316 secondes
- **coût en population**: 1
- **combat/logistique runtime**: attack=16 (sharp), defense=[blunt:18, sharp:12, distance:7], speed=6, booty=8, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Marksman
- **id**: `marksman`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 1` + méta recherche `archer` (enforcement actif)
- **coûts**: ore=55, stone=100, iron=40, favor=0
- **temps d’entraînement**: 1144 secondes
- **coût en population**: 1
- **combat/logistique runtime**: attack=23 (distance), defense=[blunt:7, sharp:8, distance:2], speed=14, booty=8, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Assault
- **id**: `assault`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 1` + méta recherche `city_guard` (enforcement actif)
- **coûts**: ore=120, stone=0, iron=75, favor=0
- **temps d’entraînement**: 1087 secondes
- **coût en population**: 1
- **combat/logistique runtime**: attack=8 (distance), defense=[blunt:7, sharp:25, distance:13], speed=12, booty=24, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Shield Guard
- **id**: `shield_guard`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 15` + méta recherche `horseman` (enforcement actif)
- **coûts**: ore=200, stone=440, iron=320, favor=0
- **temps d’entraînement**: 4710 secondes
- **coût en population**: 4
- **combat/logistique runtime**: attack=56 (sharp), defense=[blunt:76, sharp:16, distance:56], speed=18, booty=64, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Raider Cavalry
- **id**: `raider_cavalry`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 10` + méta recherche `chariot` (enforcement actif)
- **coûts**: ore=240, stone=120, iron=360, favor=0
- **temps d’entraînement**: 3835 secondes
- **coût en population**: 3
- **combat/logistique runtime**: attack=60 (blunt), defense=[blunt:18, sharp:1, distance:24], speed=22, booty=72, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Breacher
- **id**: `breacher`
- **catégorie**: `ground`
- **bâtiment de production**: `barracks`
- **prérequis runtime**: `barracks >= 5` + méta recherche `catapult` (enforcement actif)
- **coûts**: ore=700, stone=700, iron=700, favor=0
- **temps d’entraînement**: 17662 secondes
- **coût en population**: 15
- **combat/logistique runtime**: attack=100 (distance), defense=[blunt:30, sharp:30, distance:30], speed=2, booty=400, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Assault Convoy
- **id**: `assault_convoy`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1` + méta recherche `light_transport_ships` (enforcement actif)
- **coûts**: ore=500, stone=500, iron=400, favor=0
- **temps d’entraînement**: 9600 secondes
- **coût en population**: 7
- **combat/logistique runtime**: attack=0 (none), defense=[blunt:0, sharp:0, distance:0], speed=8, booty=0, transport=26
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Swift Carrier
- **id**: `swift_carrier`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1` + méta recherche `light_transport_ships` (enforcement actif)
- **coûts**: ore=800, stone=0, iron=400, favor=0
- **temps d’entraînement**: 7200 secondes
- **coût en population**: 5
- **combat/logistique runtime**: attack=0 (none), defense=[blunt:0, sharp:0, distance:0], speed=15, booty=0, transport=10
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Interception Sentinel
- **id**: `interception_sentinel`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1` + méta recherche `bireme` (enforcement actif)
- **coûts**: ore=800, stone=700, iron=180, favor=0
- **temps d’entraînement**: 9900 secondes
- **coût en population**: 8
- **combat/logistique runtime**: attack=24 (naval), defense=[blunt:0, sharp:0, distance:0], speed=15, booty=0, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Ember Drifter
- **id**: `ember_drifter`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1` + méta recherche `light_ship` (enforcement actif)
- **coûts**: ore=500, stone=750, iron=150, favor=0
- **temps d’entraînement**: 4000 secondes
- **coût en population**: 8
- **combat/logistique runtime**: attack=0 (naval), defense=[blunt:0, sharp:0, distance:0], speed=5, booty=0, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Rapid Escort
- **id**: `rapid_escort`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1` + méta recherche `fire_ship` (enforcement actif)
- **coûts**: ore=1300, stone=300, iron=800, favor=0
- **temps d’entraînement**: 14400 secondes
- **coût en population**: 10
- **combat/logistique runtime**: attack=200 (naval), defense=[blunt:0, sharp:0, distance:0], speed=13, booty=60, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Bulwark Trireme
- **id**: `bulwark_trireme`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 1` + méta recherche `trireme` (enforcement actif)
- **coûts**: ore=2000, stone=1300, iron=1300, favor=0
- **temps d’entraînement**: 14400 secondes
- **coût en population**: 16
- **combat/logistique runtime**: attack=250 (naval), defense=[blunt:0, sharp:0, distance:0], speed=15, booty=0, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().

### Colonization Convoy
- **id**: `colonization_convoy`
- **catégorie**: `naval`
- **bâtiment de production**: `space_dock`
- **prérequis runtime**: `space_dock >= 10` + méta recherche `colony_ship` (enforcement actif)
- **coûts**: ore=10000, stone=10000, iron=10000, favor=0
- **temps d’entraînement**: 57535 secondes
- **coût en population**: 170
- **combat/logistique runtime**: attack=0 (none), defense=[blunt:0, sharp:0, distance:0], speed=3, booty=0, transport=0
- **intégration runtime**: validation de prérequis + coûts + population via canStartTroopTraining(), puis enqueue via startTroopTraining().


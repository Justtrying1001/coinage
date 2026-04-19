# Phalanx Lancer

## 1. Résumé
- ID technique: `phalanx_lancer`
- Catégorie: `ground`
- Bâtiment requis: `barracks`
- Niveau du bâtiment requis: 1
- Recherche requise: hoplite
- Statut dans le code: partiel (recrutement branché; combat/déplacement/transport/conquête non implémentés dans ce runtime)
- Rôle gameplay réel: Unité terrestre de combat.
- Réellement recrutable / utilisable dans le runtime actuel: partiel

## 2. Déblocage et accès
- Bâtiment requis: `barracks`
- Niveau requis: 1
- Recherche requise éventuelle: hoplite
- Branche concernée: ground / barracks
- Conditions spécifiques: vérification ressources + population + prereqs via canStartTroopTraining.
- Passe par la queue standard: oui

## 3. Fiche de stats complète
| Nom | ID | Catégorie | Ore | Stone | Iron | Favor cost | Temps d’entraînement | Population | Attaque | Type d’attaque | Défense blunt | Défense sharp | Défense distance | Vitesse | Booty | Capacité transport | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---|
| Phalanx Lancer | phalanx_lancer | ground | 0 | 75 | 150 | 0 | 1316 | 1 | 16 | sharp | 18 | 12 | 7 | 6 | 8 | 0 | Anti-blunt spear line. |

## 4. Rôle gameplay réel
- Unité terrestre de combat.
- Interprétation limitée au code: note config présente (`Anti-blunt spear line.`); pas d’extrapolation hors runtime.

## 5. Comment elle est réellement utilisée dans le code
- `canStartTroopTraining` vérifie quantité entière positive, bâtiment requis, recherche requise (enforcement activé), ressources et population libre.
- `startTroopTraining` applique un multiplicateur de vitesse basé sur `trainingSpeedPct` (borné à `Math.max(0.35, 1 - pct/100)`).
- La population est réservée pendant l’entraînement (`populationReserved`) puis consommée via le stock de troupes.
- `transportCapacity` est en config mais pas exploité dans les systèmes runtime actuels.
- Les stats de combat (`attack`, `attackType`, défenses) sont configurées mais aucune résolution de combat n’est branchée ici.

## 6. Pré requis et dépendances liées
- Bâtiment source: `barracks`
- Recherche source: hoplite
- Interaction avec armament/barracks/space_dock/research_lab: temps d’entraînement dépend de trainingSpeedPct dérivé (barracks + space_dock + armament_factory + recherches + politique).

## 7. Cas spéciaux / edge cases
- Unité avec `attackType: sharp`.
- Aucun edge case supplémentaire détecté au runtime.
- Colonisation: non concernée.

## 8. Statut d’implémentation / zones d’attention
- Config: présente dans CITY_ECONOMY_CONFIG.troops.
- Branché runtime: oui pour entraînement/stockage; non pour combat/déplacement/conquête/transport
- Exposé au joueur: oui dans la liste training UI (si guard ok)
- Divergence catalogue: pas d’entrée dans FULL_UNIT_CATALOG

## 9. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)

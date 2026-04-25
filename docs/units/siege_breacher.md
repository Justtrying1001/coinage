# Siege Artillery

## 1. Résumé
- ID technique: `siege_breacher`
- Catégorie: `ground`
- Bâtiment requis: `barracks`
- Niveau du bâtiment requis: 5
- Recherche requise: siege_artillery
- Statut dans le code: partiel (recrutement branché; combat/déplacement/transport/conquête non implémentés dans ce runtime)
- Rôle gameplay réel: Transport logistique/naval.
- Réellement recrutable / utilisable dans le runtime actuel: partiel

## 2. Déblocage et accès
- Bâtiment requis: `barracks`
- Niveau requis: 5
- Recherche requise éventuelle: siege_artillery
- Branche concernée: ground / barracks
- Conditions spécifiques: vérification ressources + population + prereqs via canStartTroopTraining.
- Passe par la queue standard: oui

## 3. Fiche de stats complète
| Nom | ID | Catégorie | Ore | Stone | Iron | Favor cost | Temps d’entraînement | Population | Attaque | Type d’attaque | Défense blunt | Défense sharp | Défense distance | Vitesse | Capacité transport | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---|
| Siege Artillery | siege_breacher | ground | 700 | 700 | 700 | 0 | 12600 | 15 | 100 | distance | 30 | 30 | 30 | 2 | 400 | Slow siege platform with high structure pressure. |

## 4. Rôle gameplay réel
- Transport logistique/naval.
- Interprétation limitée au code: note config présente (`Slow siege platform with high structure pressure.`); pas d’extrapolation hors runtime.

## 5. Comment elle est réellement utilisée dans le code
- `canStartTroopTraining` vérifie quantité entière positive, bâtiment requis, recherche requise (enforcement activé), ressources et population libre.
- `startTroopTraining` applique un multiplicateur de vitesse basé sur `trainingSpeedPct` (borné à `Math.max(0.35, 1 - pct/100)`).
- La population est réservée pendant l’entraînement (`populationReserved`) puis consommée via le stock de troupes.
- `transportCapacity` est en config mais pas exploité dans les systèmes runtime actuels.
- Unité de transport dans la config; aucune logique de chargement/déchargement n’est implémentée dans ce repo.

## 6. Pré requis et dépendances liées
- Bâtiment source: `barracks`
- Recherche source: siege_artillery
- Interaction avec armament/barracks/space_dock/research_lab: temps d’entraînement dépend de trainingSpeedPct dérivé (barracks + space_dock + armament_factory + recherches + politique).

## 7. Cas spéciaux / edge cases
- Unité avec `attackType: distance`.
- Transport: capacité configurée mais aucune mécanique de transport runtime implémentée.
- Colonisation: non concernée.

## 8. Statut d’implémentation / zones d’attention
- Config: présente dans CITY_ECONOMY_CONFIG.troops.
- Branché runtime: oui pour entraînement/stockage; non pour combat/déplacement/conquête/transport
- Exposé au joueur: oui dans la liste training UI (si guard ok)
- Divergence catalogue: catalog: phase=v0, gameplayImplemented=true, definitionStatus=fully_defined

## 9. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)

# Colonization Convoy

## 1. Résumé
- ID technique: `colonization_convoy`
- Catégorie: `naval`
- Bâtiment requis: `space_dock`
- Niveau du bâtiment requis: 10
- Recherche requise: colony_ship
- Statut dans le code: partiel (recrutement branché; combat/déplacement/transport/conquête non implémentés dans ce runtime)
- Rôle gameplay réel: Colonisation/conquête (selon notes), avec consommation attendue mais non implémentée ici.
- Réellement recrutable / utilisable dans le runtime actuel: partiel

## 2. Déblocage et accès
- Bâtiment requis: `space_dock`
- Niveau requis: 10
- Recherche requise éventuelle: colony_ship
- Branche concernée: naval / space_dock
- Conditions spécifiques: vérification ressources + population + prereqs via canStartTroopTraining.
- Passe par la queue standard: oui

## 3. Fiche de stats complète
| Nom | ID | Catégorie | Ore | Stone | Iron | Favor cost | Temps d’entraînement | Population | Attaque | Type d’attaque | Défense blunt | Défense sharp | Défense distance | Vitesse | Booty | Capacité transport | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---|
| Colonization Convoy | colonization_convoy | naval | 10000 | 10000 | 10000 | 0 | 57535 | 170 | 0 | none | 0 | 0 | 0 | 3 | 0 | 0 | Colonization ship; consumed on successful city foundation/conquest and constrained by conquest travel rules. |

## 4. Rôle gameplay réel
- Colonisation/conquête (selon notes), avec consommation attendue mais non implémentée ici.
- Interprétation limitée au code: note config présente (`Colonization ship; consumed on successful city foundation/conquest and constrained by conquest travel rules.`); pas d’extrapolation hors runtime.

## 5. Comment elle est réellement utilisée dans le code
- `canStartTroopTraining` vérifie quantité entière positive, bâtiment requis, recherche requise (enforcement activé), ressources et population libre.
- `startTroopTraining` applique un multiplicateur de vitesse basé sur `trainingSpeedPct` (borné à `Math.max(0.35, 1 - pct/100)`).
- La population est réservée pendant l’entraînement (`populationReserved`) puis consommée via le stock de troupes.
- `transportCapacity` est en config mais pas exploité dans les systèmes runtime actuels.
- Les stats de combat (`attack`, `attackType`, défenses) sont configurées mais aucune résolution de combat n’est branchée ici.
- La note parle de consommation à la colonisation/conquête, mais aucun flux de colonisation/conquête runtime n’est implémenté dans ce module.

## 6. Pré requis et dépendances liées
- Bâtiment source: `space_dock`
- Recherche source: colony_ship
- Interaction avec armament/barracks/space_dock/research_lab: temps d’entraînement dépend de trainingSpeedPct dérivé (barracks + space_dock + armament_factory + recherches + politique).

## 7. Cas spéciaux / edge cases
- Unité avec `attackType: none`.
- Aucun edge case supplémentaire détecté au runtime.
- Colonisation/conquête mentionnée en note, mais pas de flux runtime dédié trouvé.

## 8. Statut d’implémentation / zones d’attention
- Config: présente dans CITY_ECONOMY_CONFIG.troops.
- Branché runtime: oui pour entraînement/stockage; non pour combat/déplacement/conquête/transport
- Exposé au joueur: oui dans la liste training UI (si guard ok)
- Divergence catalogue: catalog: phase=later, gameplayImplemented=false, definitionStatus=partially_defined

## 9. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)

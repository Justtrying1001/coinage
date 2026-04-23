# Strike Dropship

## 1. Résumé
- ID technique: `assault_dropship`
- Catégorie: `naval`
- Bâtiment requis: `space_dock`
- Niveau du bâtiment requis: 1
- Recherche requise: light_transport_ships
- Statut dans le code: partiel (recrutement branché; combat/déplacement/transport/conquête non implémentés dans ce runtime)
- Rôle gameplay réel: Transport logistique/naval.
- Réellement recrutable / utilisable dans le runtime actuel: partiel

## 2. Déblocage et accès
- Bâtiment requis: `space_dock`
- Niveau requis: 1
- Recherche requise éventuelle: light_transport_ships
- Branche concernée: naval / space_dock
- Conditions spécifiques: vérification ressources + population + prereqs via canStartTroopTraining.
- Passe par la queue standard: oui

## 3. Fiche de stats complète
| Nom | ID | Catégorie | Ore | Stone | Iron | Favor cost | Temps d’entraînement | Population | Attaque | Type d’attaque | Défense blunt | Défense sharp | Défense distance | Vitesse | Booty | Capacité transport | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---|
| Strike Dropship | assault_dropship | naval | 500 | 500 | 400 | 0 | 9600 | 7 | 0 | none | 0 | 0 | 0 | 8 | 0 | 26 | Standard transport ship. |

## 4. Rôle gameplay réel
- Transport logistique/naval.
- Interprétation limitée au code: note config présente (`Standard transport ship.`); pas d’extrapolation hors runtime.

## 5. Comment elle est réellement utilisée dans le code
- `canStartTroopTraining` vérifie quantité entière positive, bâtiment requis, recherche requise (enforcement activé), ressources et population libre.
- `startTroopTraining` applique un multiplicateur de vitesse basé sur `trainingSpeedPct` (borné à `Math.max(0.35, 1 - pct/100)`).
- La population est réservée pendant l’entraînement (`populationReserved`) puis consommée via le stock de troupes.
- `transportCapacity` est en config mais pas exploité dans les systèmes runtime actuels.
- Les stats de combat (`attack`, `attackType`, défenses) sont configurées mais aucune résolution de combat n’est branchée ici.
- Unité de transport dans la config; aucune logique de chargement/déchargement n’est implémentée dans ce repo.

## 6. Pré requis et dépendances liées
- Bâtiment source: `space_dock`
- Recherche source: light_transport_ships
- Interaction avec armament/barracks/space_dock/research_lab: temps d’entraînement dépend de trainingSpeedPct dérivé (barracks + space_dock + armament_factory + recherches + politique).

## 7. Cas spéciaux / edge cases
- Unité avec `attackType: none`.
- Transport: capacité configurée mais aucune mécanique de transport runtime implémentée.
- Colonisation: non concernée.

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

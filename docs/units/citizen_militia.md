# Citizen Militia

## 1. Résumé
- ID technique: `citizen_militia`
- Catégorie: `militia`
- Bâtiment requis: `housing_complex`
- Niveau du bâtiment requis: 0
- Recherche requise: aucune
- Statut dans le code: partiel (définie en config, non entraînable via queue standard)
- Rôle gameplay réel: Défense locale temporaire uniquement.
- Réellement recrutable / utilisable dans le runtime actuel: partiel

## 2. Déblocage et accès
- Bâtiment requis: `housing_complex`
- Niveau requis: 0
- Recherche requise éventuelle: aucune
- Branche concernée: militia
- Conditions spécifiques: milice non entraînable via queue standard; activation dédiée.
- Passe par la queue standard: non

## 3. Fiche de stats complète
| Nom | ID | Catégorie | Ore | Stone | Iron | Favor cost | Temps d’entraînement | Population | Attaque | Type d’attaque | Défense blunt | Défense sharp | Défense distance | Vitesse | Booty | Capacité transport | Notes |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---:|---:|---|
| Citizen Militia | citizen_militia | militia | 0 | 0 | 0 | 0 | 0 | 0 | 0 | none | 6 | 8 | 4 | 0 | 0 | 0 | Emergency call-up defenders; not recruitable through standard queues. |

## 4. Rôle gameplay réel
- Défense locale temporaire uniquement.
- Interprétation limitée au code: note config présente (`Emergency call-up defenders; not recruitable through standard queues.`); pas d’extrapolation hors runtime.

## 5. Comment elle est réellement utilisée dans le code
- Refus explicite dans `canStartTroopTraining`: la milice ne passe jamais par la queue standard.
- Activée via `activateMilitia` (3h), pénalité production -50%, local defense only (`canSendMilitiaOnAttack` et `canTransferMilitia` retournent `false`).

## 6. Pré requis et dépendances liées
- Bâtiment source: `housing_complex`
- Recherche source: aucune
- Interaction avec armament/barracks/space_dock/research_lab: milice dépend de housing_complex via activateMilitia; pas de queue barracks/space_dock.

## 7. Cas spéciaux / edge cases
- Unité avec `attackType: none`.
- Milice: non transférable et non envoyable en attaque.
- Colonisation: non concernée.

## 8. Statut d’implémentation / zones d’attention
- Config: présente dans CITY_ECONOMY_CONFIG.troops.
- Branché runtime: partiel (activation spéciale uniquement)
- Exposé au joueur: oui via panneau militia UI
- Divergence catalogue: pas d’entrée dans FULL_UNIT_CATALOG

## 9. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)

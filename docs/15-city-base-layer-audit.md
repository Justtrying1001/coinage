# Audit technique complet — City View & préparation du futur city base layer

_Date de l'audit: 2026-04-13_

## 1) Executive summary

### État actuel (résumé clair)
- La `city3d` existe déjà comme **prototype de fondation** branché dans le même contrôleur de modes que `galaxy2d` et `planet3d`, via `CoinageRenderApp` + `RenderModeController`.
- Cette implémentation actuelle (`CityFoundationMode`) est un **éditeur de grille debug jouable** (placement bâtiments/routes/déplacement), pas un rendu city-builder premium centré sur un base layer biomique.
- La structure de données côté city (`CityLayoutStore`) est déjà utile: grid/occupancy/roads/buildings/expansion + règles de validité.
- Le pipeline planète/biomes est déjà riche et déterministe (8 archétypes), avec des paramètres visuels réutilisables pour nourrir une identité de city base layer par biome.

### Ce qui est exploitable immédiatement
- Architecture de switch de modes (router runtime) déjà en place (`galaxy2d`/`planet3d`/`city3d`).
- Contrats de seed/archetype stables (`planetProfileFromSeed`, `createPlanetGenerationConfig`).
- Données biomiques déjà détaillées et typées (gradients, surfaceMode water/ice/lava, humidité, roughness, wetness, etc.).
- Store layout city déjà séparé du renderer, donc adaptable vers grille invisible + lots visuels.

### Ce qui pose problème pour la cible produit
- La grille est visuellement dominante en permanence (`city-foundation-grid` + tuiles `button`) alors que la cible demande une grille sous-jacente non visible hors build mode.
- Le mode city est aujourd'hui orienté debug/construction (boutons mode build, routes, footprints), alors que la prochaine étape demandée est uniquement le base layer visuel.
- Aucun branchement biome -> rendu city dans `CityFoundationMode`.
- Plusieurs labels/UX indiquent un état temporaire/prototypage (“City Foundation · Town Hall Hub”, “City View is temporarily offline.” côté Planet3D inspect).

---

## 2) Current architecture map

### 2.1 Entrée et routage de la City View (`city3d`)
- Entrée route UI: `/game` via `src/app/game/page.tsx` -> `GameShell`.
- `GameShell` expose 3 boutons de mode (`Galaxy 2D`, `Planet 3D`, `City Foundation`) et maintient l'état `mode` + `selectedPlanet`.
- `GameRenderViewport` instancie `CoinageRenderApp` une fois, puis pilote `setMode()` et `setSelectedPlanet()`.
- `CoinageRenderApp` possède le vrai mode controller runtime:
  - type `RenderMode = 'galaxy2d' | 'planet3d' | 'city3d'`
  - factory par défaut: `createCityMode` -> `new CityFoundationMode(activePlanet, context)`.
  - switch mode centralisé dans `switchMode(nextMode)`.

### 2.2 Modules city actuels
- `src/game/render/modes/CityFoundationMode.ts`
  - Mode `id='city3d'`.
  - UI DOM impérative (section root, toolbar, grille).
  - Build modes: `idle | place-building | place-road | move-building`.
  - Bibliothèque bâtiments en dur (`habitatSmall`, `workshop`, `depotLarge`).
  - Interaction pointeur avec prévisualisation de placement, drag road, move building.
- `src/game/city/layout/cityLayout.ts`
  - `CityLayoutStore`: source de vérité layout logique (blocked, expansion, roads, buildings).
  - Seed scaffold initial: bordures bloquées, HQ fixe 3x3, artères routières centrales, bandes expansion.
  - Fonctions de validation (`canPlaceBuilding`, `canPlaceRoad`, voisinage route/hub, collisions, bounds).

### 2.3 Shell/UI/HUD/overlays city
- HUD city entièrement local à `CityFoundationMode`:
  - toolbar title/meta/hint
  - boutons de modes/build blueprints/back.
- Style city centralisé dans `src/styles/globals.css` sous namespace `.city-foundation-*`.
- Pas de “scene 3D city” dédiée: c'est un overlay DOM grid sur le viewport host.

### 2.4 Renderers/scenes/canvases concernés indirectement
- `CoinageRenderApp` garde un seul controller actif à la fois; city remplace planet/galaxy au niveau mount/destroy.
- `Planet3DMode` contient encore message de status “City View is temporarily offline.” dans le panneau inspect (legacy wording à harmoniser).

### 2.5 Tests city / mocks / états debug
- `src/game/city/layout/cityLayout.test.ts` couvre:
  - seed HQ + routes,
  - collisions bâtiments,
  - move validation,
  - règles de route placement.
- `src/game/app/CoinageRenderApp.test.ts` couvre intégration mode switching + propagation selected planet, avec `FakeCityMode` mock.
- États debug/presets city présents:
  - constantes grid 20x14,
  - BUILDING_LIBRARY hardcodée,
  - textes HUD orientés prototype.

### 2.6 Audit Planet/Biome: où vivent les données réutilisables
- Source archétypes et paramètres “planète seed -> biome/profile”:
  - `src/game/world/galaxyGenerator.ts`
    - `pickArchetype()` définit les 8 biomes existants réels.
    - `ARCHETYPE_CONFIGS` définit plages des paramètres visuels globaux.
- Source presets visuels détaillés par biome:
  - `src/game/planet/presets/archetypes.ts`
    - `BASE_PRESETS` (generation filters, gradients, material, postfx).
    - mapping `surfaceModeForArchetype` -> `water|ice|lava`.
    - `createPlanetGenerationConfig(seed, profile)` fusionne preset + profil seedé.
- Contrats de types partagés:
  - `src/game/render/types.ts` (`PlanetArchetype`, `PlanetVisualProfile`).
  - `src/game/planet/types.ts` (`PlanetGenerationConfig`, `PlanetSurfaceMode`, material fields).

---

## 3) Keep / Adapt / Remove / Review (module-by-module)

## KEEP
1. `src/game/app/CoinageRenderApp.ts`
   - **Pourquoi KEEP**: architecture de mode switching saine, déjà prête pour remplacer l'implémentation interne de `city3d` sans casser la navigation.
2. `src/game/render/types.ts`
   - **Pourquoi KEEP**: union `RenderMode` + `PlanetArchetype` + `PlanetVisualProfile` déjà alignés avec l'objectif de brancher city sur seed/biome existants.
3. `src/game/city/layout/cityLayout.ts` (partie logique pure de contraintes)
   - **Pourquoi KEEP partiel**: moteur occupancy/connectivité utile comme structure sous-jacente future (grille cachée), indépendamment du rendu visuel actuel.
4. `src/game/world/galaxyGenerator.ts` (profilage biome)
   - **Pourquoi KEEP**: source canonique déterministe de biome + paramètres macro.
5. `src/game/planet/presets/archetypes.ts` + `src/game/planet/types.ts`
   - **Pourquoi KEEP**: base biomique la plus riche du repo; réutilisation directe recommandée pour éviter divergence entre Planet3D et City.

## ADAPT
1. `src/game/render/modes/CityFoundationMode.ts`
   - **Pourquoi ADAPT fort**: contient trop de logique debug/build visuellement exposée, mais reste le bon point d'ancrage `city3d`.
   - **Adaptation attendue**: basculer vers un renderer base layer biomique + lots visuels; déplacer la grille en structure interne non rendue par défaut.
2. `src/styles/globals.css` (bloc `.city-foundation-*`)
   - **Pourquoi ADAPT**: styles actuels orientés grille technique; à remplacer par styles de scène premium biomique + overlays HUD non-debug.
3. `src/components/game/GameShell.tsx`
   - **Pourquoi ADAPT léger**: libellé “City Foundation” à renommer quand le mode sera base layer réel; garder la logique de switch.
4. `src/game/city/layout/cityLayout.test.ts`
   - **Pourquoi ADAPT**: conserver tests logiques de layout, puis ajouter tests “grille cachée hors build mode” côté renderer city futur.

## REMOVE
1. Dans `CityFoundationMode` uniquement: UI/contrôles orientés build pour cette étape base-layer
   - modes `place-road`, `move-building`, blueprint buttons, interactions de placement.
   - **Pourquoi REMOVE (dans le scope de la future implémentation base-layer)**: hors périmètre demandé et contre la cible visuelle (grille debug omniprésente).
2. Dans `globals.css`: règles visuelles de grille permanente
   - `.city-foundation-grid` + `.city-foundation-tile*` rendues en continu.
   - **Pourquoi REMOVE**: incompatible avec l'exigence “grille invisible hors build mode”.

## REVIEW
1. `src/game/planet/runtime/SettlementSlots.ts` et `SettlementSlotLayer.ts`
   - **Pourquoi REVIEW**: ce sont des slots sur sphère planète (inspection planet mode), pas un layout city surface plane.
   - Peut inspirer la notion de “lots sélectionnables”, mais réutilisation directe probablement faible.
2. Message Planet inspect “City View is temporarily offline.” (`Planet3DMode`)
   - **Pourquoi REVIEW**: wording legacy; à harmoniser en cohérence produit lors de la refonte city, mais pas bloquant technique.

---

## 4) Biome reuse map (liste complète + paramètres exploitables)

## Biomes réellement existants dans le code
Les 8 biomes/archétypes existants sont:
1. `oceanic`
2. `arid`
3. `frozen`
4. `volcanic`
5. `mineral`
6. `terrestrial`
7. `jungle`
8. `barren`

Ils sont définis explicitement dans:
- `pickArchetype()` (`galaxyGenerator.ts`)
- `PlanetArchetype` union (`render/types.ts`)
- `BASE_PRESETS` (`planet/presets/archetypes.ts`)

## Paramètres réutilisables pour le futur city base layer
### Niveau profil seedé (`PlanetVisualProfile`)
Exemples utiles pour city:
- humidité/océan (`humidityStrength`, `oceanLevel`) -> type de sol, présence eau/saturation visuelle.
- rugosité/relief (`roughness`, `reliefStrength`, `reliefSharpness`, `ridgeWeight`) -> microrelief du terrain de base.
- volcanisme/minéralité (`emissiveIntensity`, `craterWeight`, `metalness`) -> accents de fissures, teinte du sol, zones basaltiques.
- polarité (`polarWeight`) -> variation froide/sèche localement.

### Niveau preset biome (`BASE_PRESETS.surface/material`)
Réutilisable directement pour “DA base layer”:
- `elevationGradient`, `depthGradient`, `canopyTint`, `shadowTint`
- `wetness`, `vegetationDensity`, `microRelief*`, `coastTintStrength`
- `hotspotCoverage`, `lavaAccentStrength`, `basaltContrast`

### Niveau catégoriel
- `surfaceModeForArchetype` donne une classe de surface simple et utile (`water`, `ice`, `lava`) pouvant piloter une factory de city base layer.

## Données plutôt non pertinentes (ou à faible valeur) pour City base layer
- Paramètres purement postfx planète (`postfx.bloom`, `exposure`) -> pertinence faible pour base city 2D/overlay.
- Résolution/filters de génération mesh planète (`generation.resolution`, `filters`) -> utiles pour planète 3D, pas nécessaires tels quels pour city.
- Runtime slots sphériques (`SettlementSlots*`) -> concerne inspection de points sur globe, pas la composition d'un sol city local.

## Fonctions/structures partageables Planet <-> City
- `planetProfileFromSeed(seed)` (source de vérité biome déterministe).
- `createPlanetGenerationConfig(seed, profile)` pour obtenir bundle de paramètres visuels détaillés.
- Types `PlanetArchetype`, `PlanetVisualProfile`, `PlanetGenerationConfig`.

---

## 5) Gaps vs cible produit

### Gap 1 — Grille visible en permanence
- Existant: mode city rendu comme grille explicite + tuiles colorées en continu.
- Cible: grille structurelle cachée, affichable uniquement plus tard en build mode.

### Gap 2 — Aucun base layer premium biomique
- Existant: rendu “debug tiles” sans direction artistique city-builder premium.
- Cible: décor/sol/parcelles intégrés visuellement avec identité biome claire.

### Gap 3 — Aucun branchage biome dans `city3d`
- Existant: `CityFoundationMode` ignore totalement `PlanetArchetype`/profile/config.
- Cible: city doit dériver visuellement de tous les biomes existants.

### Gap 4 — Scope fonctionnel trop orienté construction
- Existant: routes/placements/move buildings déjà actifs dans le mode city.
- Cible de cette étape: **uniquement** base layer visuel (pas gameplay construction).

### Gap 5 — Contrat de réutilisation biome non encapsulé pour city
- Existant: pipeline biome riche mais centré Planet3D.
- Cible: adapter ce pipeline pour exposer un “city-biome visual descriptor” partagé.

### Gap 6 — Tests city focalisés layout logique, pas rendu biomique
- Existant: bons tests de règles grid; peu de garanties sur pipeline city visuel.
- Cible: ajouter tests de mapping biome->descriptor et de non-affichage de la grille hors build mode.

---

## 6) Recommended implementation plan (prochaine tâche)

## Ordre recommandé (concret, repo-centric)

### Étape 1 — Créer un descripteur biomique city (sans renderer final)
- Ajouter un module dédié (ex. `src/game/city/biome/cityBiomeDescriptor.ts`) qui:
  1. reçoit `seed` ou `(profile + generationConfig)`,
  2. appelle `planetProfileFromSeed` + `createPlanetGenerationConfig`,
  3. retourne un objet city-focused (palette sol, humidité visuelle, relief de base, type de lots, accents biome).
- Objectif: découpler la préparation des données biomiques de l'UI city.

### Étape 2 — Remplacer le rendu permanent de grille dans `CityFoundationMode`
- Garder le point d'entrée `city3d` et le contrat `RenderModeController`.
- Retirer l'affichage systématique `.city-foundation-grid` et les tuiles debug.
- Implémenter un rendu de base layer (DOM/CSS ou canvas) qui lit le descripteur biome.
- Garder la grille en mémoire via `CityLayoutStore` mais sans la peindre visiblement par défaut.

### Étape 3 — Introduire la notion de lots visuels intégrés
- Réutiliser la logique de zones (core/expansion/blocked) du store pour dériver des “lots” esthétiques non-grille (patches/parcelles).
- Les lots doivent rester alignables avec la structure grid interne (pour build mode futur), mais sans tracer chaque cellule.

### Étape 4 — Nettoyer le scope build/debug pour cette phase
- Désactiver/retirer dans le mode city base-layer:
  - placement bâtiments,
  - routes interactives,
  - move building,
  - boutons blueprint.
- Conserver uniquement un HUD minimal orienté inspection visuelle/identité biome.

### Étape 5 — Couvrir explicitement les 8 biomes
- Ajouter tests unitaires sur des seeds représentatifs pour vérifier que chaque archetype aboutit à un descriptor city valide.
- Vérifier que chaque archetype active un thème distinct (au moins palette + surface class + accent set).

### Étape 6 — Harmonisation UX cross-mode sans casser l'architecture
- Conserver `CoinageRenderApp` inchangé (switch + selectedPlanet propagation).
- Adapter labels textuels (`City Foundation`, message offline Planet3D) pour cohérence produit.
- Éviter toute régression sur `CoinageRenderApp.test.ts` (mode lifecycle).

## Fichiers à réutiliser / modifier / supprimer (pré-plan)

### Réutiliser tels quels
- `src/game/app/CoinageRenderApp.ts`
- `src/game/render/modes/RenderModeController.ts`
- `src/game/world/galaxyGenerator.ts` (API publique)
- `src/game/planet/presets/archetypes.ts` (API publique)
- `src/game/planet/types.ts`

### Modifier
- `src/game/render/modes/CityFoundationMode.ts` (pivot principal)
- `src/styles/globals.css` (suppression rendu grille permanent)
- `src/components/game/GameShell.tsx` (label mode)
- tests city (ajouts mapping biome + visibilité grille)

### Supprimer (dans l'implémentation future)
- Blocs UI/debug strictement build-mode dans `CityFoundationMode` pour cette étape.
- Styles `.city-foundation-tile*` si remplacés par un système base layer non-grille.

## Risques / vigilance
- **Risque 1**: casser la continuité mode switch -> garder `city3d` branché via même controller contract.
- **Risque 2**: dupliquer la logique biome -> centraliser dans un descriptor partagé, ne pas re-hardcoder des palettes côté city.
- **Risque 3**: perdre l'alignement futur build mode -> conserver `CityLayoutStore` comme grille cachée de vérité.
- **Risque 4**: incomplet sur tous les biomes -> écrire tests explicites sur les 8 archétypes.

## Points explicitement incertains
- Le repo ne contient pas (à ce stade) de spec finale sur le format visuel exact des “lots/parcelles” city premium; seul le besoin produit est clair.
- Le meilleur support technique (DOM/CSS vs canvas/three dédié city) n'est pas encore tranché dans l'existant city (actuellement full DOM grid).

# Audit complet — Génération procédurale de planètes & rendu Planet View

_Date: 2026-04-08_

## 1) Portée et objectif

Cet audit couvre:
- la génération canonique des planètes (seed, classification, ADN visuel),
- la génération de layout galaxie et résolution d’identité,
- le pipeline de rendu (galaxy view + planet view),
- la cohérence globale, les risques de conflit, les paramètres actifs,
- l’identification de code utilisé vs partiellement inactif/non utilisé.

## 2) Architecture actuelle (synthèse)

Le système est organisé en 3 couches:

1. **Domaine (canonique, déterministe)**
   - `generateCanonicalPlanet(...)` construit l’identité, la classification, le DNA visuel et le `render profile` à partir de `worldSeed + planetSeed`.
2. **Monde/manifest**
   - le manifest galaxie crée les planètes canoniques, calcule leur layout, puis injecte la position monde dans l’identité.
3. **Rendering Three.js**
   - `createPlanetRenderInstance(...)` transforme un `CanonicalPlanet` en groupe Three.js (surface + anneaux, avec options de vue), puis anime les couches.

## 3) Génération procédurale: fonctionnement détaillé

### 3.1 Déterminisme

Le déterminisme est correctement implémenté:
- seed canonique: `deriveSeed("${worldSeed}::${planetSeed}", "planet-canonical-v2")`,
- RNG seedé stable via `createSeededRng(...)`,
- sous-seeds dédiées (surface, moisture, thermal, clouds, bands, rings).

Conséquence: une même paire (`worldSeed`, `planetSeed`) reproduit strictement le même profil planète.

### 3.2 Familles et recettes

Le moteur sélectionne une recette pondérée parmi 9 familles:
- `terrestrial-lush`, `oceanic`, `desert-arid`, `ice-frozen`, `volcanic-infernal`, `barren-rocky`, `toxic-alien`, `gas-giant`, `ringed-giant`.

Chaque recette encode:
- classes (surface, relief, roughness, atmosphère),
- plages de paramètres (ocean/cloud coverage, relief, roughness, specular, emissive, banding),
- palettes colorimétriques,
- capacité d’anneaux (option forcée).

### 3.3 Identity / Classification / DNA / Render

La pipeline canonique est proprement segmentée:
- **Identity**: id, seeds, famille, classe de rayon, position monde,
- **Classification**: modèle de surface, atmosphère, roughness/relief classes, flags océans/nuages/anneaux,
- **Visual DNA**: couleurs, couvertures, densité atmosphère, relief/roughness/specular/emissive/banding, noise seeds, rotation,
- **Render Profile**: mapping directement consommable par le renderer (surface/clouds/atmosphere/rings + debug).

### 3.4 Échelles / guardrails

La conversion rayon physique -> rayon rendu est centralisée:
- `MIN_RENDER_RADIUS=2.8`, `MAX_RENDER_RADIUS=5.9`,
- protection silhouette `>= 3.05`.

Cette base est cohérente avec les tests de non-régression du projet.

## 4) Génération terrain/noise et maillage

### 4.1 Terrain noise

`sampleTerrain(...)` bifurque:
- `sampleSolid(...)` pour surfaces solides/frozen/volatile,
- `sampleGaseous(...)` pour géantes gazeuses.

Techniques utilisées:
- noise 3D interpolé,
- fBm,
- ridged noise,
- crater field.

Sorties terrain riches:
- `height01`, `landMask`, `coastMask`, `oceanDepth`,
- `continentMask`, `humidityMask`, `temperatureMask`,
- `erosionMask`, `craterMask`, `thermalMask`, `bandMask`,
- `macroRelief`, `midRelief`, `microRelief`, `silhouetteMask`.

### 4.2 Géométrie déplacée

`buildDisplacedSphereGeometry(...)`:
- génère une sphère,
- échantillonne le terrain sur chaque vertex,
- applique un déplacement multi-échelle (macro/mid/micro) avec clamp,
- ajoute tous les masques en attributs GPU (`aHeight`, `aLandMask`, etc.).

La cohérence terrain -> shader est bonne: les attributs générés sont consommés côté shader planète.

## 5) Pipeline de rendu

### 5.1 Planet View

`PlanetView.tsx`:
- résout l’identité depuis le manifest,
- construit scène + fond spatial + caméra perspective + composer,
- instancie la planète en mode `planet`,
- calcule un framing dynamique robuste (distance, near/far, resize),
- anime via `updatePlanetLayerAnimation(...)`.

### 5.2 Galaxy View

`GalaxyView.tsx`:
- charge le manifest complet,
- caméra orthographique + pan/drag,
- double-clic raycast pour naviguer vers `/planet/[id]`,
- instrumentation performance extensive.

⚠️ Point clé: `INSTANCED_RADIUS_THRESHOLD = Infinity` => **toutes** les planètes de la galaxie passent par le chemin instancié (sphère simple + couleur `colorMid`) et non par le renderer shader détaillé.

### 5.3 Shaders surface

Le rendu planète haute qualité est modulaire:
- `surface-core.glsl` (construction albedo/masques/relief),
- `surface-biome.glsl` (teinte climatique),
- `surface-lighting.glsl` (éclairage stylisé diffus/rim/spec + emissive).

Le shader galaxie est volontairement simplifié (bruit procédural in-shader sans attributs terrain).

## 6) Paramètres utilisés (inventaire)

### 6.1 Paramètres génération (domaine)

- Global:
  - `MIN_RENDER_RADIUS=2.8`, `MAX_RENDER_RADIUS=5.9`.
- View profile:
  - Galaxy: `meshSegments=16`, `ringSegments=96`, `lightingBoost=1.38`, `shadingContrast=0.24`.
  - Planet: `meshSegments=160`, `ringSegments=320`, `lightingBoost=1.55`, `shadingContrast=0.32`.
  - `enableClouds=false`, `enableAtmosphere=false`, `enableOceanLayer=false` dans les deux vues.
- Rotation DNA:
  - `surfaceSpeed` ~ [0.04..0.22] (ou [0.04..0.12] gazeux),
  - `cloudSpeed` ~ [0.06..0.30] (ou [0.06..0.18] gazeux),
  - `axialTilt` ~ [-0.42..0.42].
- Anneaux:
  - inner ratio [1.3..1.6] (ou [1.35..1.72] gazeux),
  - outer ratio [1.82..2.22] (ou [2.0..2.7] gazeux),
  - tilt [-0.66..0.66], opacity [0.18..0.48] / [0.3..0.78].

### 6.2 Paramètres monde/galaxie

- Runtime config:
  - `planetCount=500`, `fieldRadius=360`, `minSpacing=9.1`.
- Densité structurelle:
  - lanes/voids procéduraux, scoring de candidats, spacing dynamique.

### 6.3 Paramètres photométrie

- `toneMapping = ACESFilmic`,
- exposure galaxie `1.82`, exposure planète `2.05`.

## 7) Code utilisé / inactif / conflits potentiels

## 7.1 Clairement utilisé

Utilisés dans le flux principal:
- génération canonique + manifest + resolve identity,
- terrain noise + géométrie déplacée,
- shaders surface (planet view),
- anneaux,
- navigation galaxy -> planet,
- tests de déterminisme/guardrails.

## 7.2 Partiellement inactif / dormant

1. **Clouds/Atmosphere/Ocean layer générés mais non rendus**
   - Les données existent dans le `render profile`, mais les toggles de view sont forcés à `false`.
   - Impact: coût de génération sans bénéfice visuel direct.

2. **`surfaceSpeed` non exploité**
   - Le renderer assigne une rotation au mesh surface uniquement pour gazeux à partir de `clouds.speed * 0.3`.
   - `visualDNA.rotation.surfaceSpeed` n’est pas utilisé.

3. **`roughness` et `specularStrength` générés mais non connectés aux shaders**
   - Ils sont stockés dans le profile, mais absents des uniforms shader et de la BRDF.

4. **`noiseSeeds.bands` non utilisé explicitement dans le renderer/shader actuel**
   - Le banding gazeux est piloté autrement (`bandMask`, bruit shader, etc.).

5. **`pickWeighted` exporté mais non utilisé**
   - La sélection pondérée effective est faite par `weightedRecipe(...)` local.

6. **Chemin non instancié en Galaxy View quasiment inatteignable**
   - Avec `INSTANCED_RADIUS_THRESHOLD = Infinity`, la branche `createPlanetRenderInstance(..., viewMode:'galaxy')` est de facto bypassée pour les planètes galaxie.

## 7.3 Conflits / incohérences fonctionnelles

1. **Conflit d’intention “layers séparées” vs rendu effectif**
   - L’architecture expose des layers clouds/atmo/ocean mais la stratégie de vue les désactive globalement.

2. **KPI/perf `atmosphereCount` trompeur**
   - Dans GalaxyView, un mesh avec `ShaderMaterial` est compté comme “atmosphere”, alors que ça inclut aussi surface/rings shader.

3. **Qualité visuelle galaxie limitée par design instancié**
   - La map galaxie n’affiche pas le niveau de détail procédural (normal avec ce choix perf), seulement une sphère unie par planète.

## 8) Cohérence et état de fonctionnement

### 8.1 Cohérence générale

**Oui, le système est globalement cohérent et fonctionnel**:
- pipeline déterministe solide,
- séparation domaine/rendu claire,
- tests en place couvrant les invariants clés,
- build/typecheck/test passent.

### 8.2 Qualité de rendu “jouable”

- **Planet View**: niveau visuel correct pour une base jouable (relief, biomes, éclairage stylisé, anneaux).
- **Galaxy View**: rendu lisible et performant, mais **volontairement simplifié** (instancing unicolore).
- **Limite principale**: absence de clouds/atmosphere/ocean layer visibles réduit la richesse perçue en vue planète.

### 8.3 Risques techniques

- dette de paramètres non branchés (roughness/specular/surfaceSpeed/bands),
- divergence potentielle entre promesse data model et rendu réel si ces champs restent dormants,
- perception QA potentiellement confuse (atmosphereCount, layers non visibles).

## 9) Verdict audit

### Verdict global

- **Statut**: ✅ Fonctionnel, déterministe, architecture saine.
- **Maturité visuelle**: ⚠️ intermédiaire (bonne base, mais couches visuelles clés désactivées).
- **Cohérence technique**: ✅ bonne, avec plusieurs champs “préparés pour plus tard”.

### Priorités recommandées

1. Brancher `roughness/specularStrength` dans les shaders (uniforms + lighting).
2. Utiliser `surfaceSpeed` pour rotation surface non gazeuse.
3. Décider stratégie Galaxy View:
   - garder instancing simplifié (perf), ou
   - seuil fini pour activer le rendu détaillé sur une sous-population.
4. Activer progressivement atmosphere/clouds (même en version low-cost).
5. Corriger la métrique `atmosphereCount` pour éviter les faux positifs.
6. Supprimer/réactiver `pickWeighted` et champs non utilisés pour réduire l’ambiguïté.

## 10) Validation effectuée pendant audit

- `npm test`: 17/17 tests pass.
- `npm run typecheck`: pass.
- `npm run build`: pass.


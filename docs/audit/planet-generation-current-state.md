# Planet Generation Current State Audit

## 1. Executive summary

1. Le pipeline planète actuel est **déterministe de bout en bout côté données** (seed monde + seed planète -> profil canonique stable), ce qui est un vrai point fort pour la cohérence inter-vues et la reproductibilité.  
2. Le système repose sur un cœur unique `generateCanonicalPlanet`, qui centralise identité, classification, ADN visuel, rayon physique, scale de rendu et paramètres shader. C’est propre pour la traçabilité, mais c’est aussi un **goulot de couplage**.  
3. Les ~500 planètes sont réellement pré-générées pour construire un manifeste (`buildGalaxyPlanetManifest`) puis mises en cache mémoire par `worldSeed`; c’est efficace pour éviter la régénération continue, mais **pas de politique d’invalidation/TTL**.  
4. La génération procédurale terrain existe vraiment (fbm + ridged + craters + humidité/température), et elle impacte à la fois la géométrie (déplacement CPU) et le shading (attributs vertex), donc ce n’est pas juste un “fake color map”.  
5. La géométrie est une `SphereGeometry` déplacée CPU, avec beaucoup d’attributs custom injectés (`aHeight`, `aLandMask`, `aThermalMask`, etc.), donc la donnée procédurale est riche.  
6. En revanche, il n’y a **aucun LOD géométrique dynamique intra-vue planète**: vue galaxie = low fixe, vue planète = high fixe. Pas de continuum distance-based.  
7. Le shader planète est monolithique et cumule biomes, ocean/land blend, relief shading, gas bands et emissive thermique dans un seul fragment shader; c’est fonctionnel mais **fragile à faire évoluer**.  
8. Les couches clouds/atmosphere/ocean existent au niveau des profils mais sont désactivées dans `createPlanetViewProfile` (`enableClouds=false`, `enableAtmosphere=false`, `enableOceanLayer=false`) : donc le pipeline “annoncé” est plus avancé que le rendu effectivement activé.  
9. Les anneaux sont réellement rendus (mesh dédié + shader), y compris en galaxie, et sont aujourd’hui la couche secondaire la plus aboutie après la surface.  
10. Différence galaxie vs planète: ce n’est pas deux systèmes indépendants, c’est **la même identité canonique**, mais deux stratégies de rendu (shader simplifié en galaxie, détaillé en planète). Bon choix architectural.  
11. Incohérence notable: en galaxie, les très petites planètes passent en `InstancedMesh` couleur unie (`colorMid`) et perdent totalement leur identité matériau/noise; c’est excellent perf, mais **forte rupture visuelle potentielle**.  
12. L’éclairage est stylisé et non-physique (hémisphère + boosts), sans vrai modèle stellaire unifié ni day/night physically-based, ce qui plafonne la montée en qualité “premium”.  
13. Le background spatial (`createStarfield`) utilise `Math.random()` non seedé : pas bloquant pour la planète, mais empêche une reproductibilité visuelle complète des captures.  
14. Le système de familles/palettes est bien structuré, mais la variété repose encore fortement sur jitter couleur + noise; pour 500 planètes, le risque de similarité perceptuelle reste réel dans certaines familles.  
15. Base actuelle: **bonne fondation procédurale deterministe et testée**, mais rendu encore semi-activé, shader trop centralisé, LOD incomplet, et architecture prête pour une refonte partielle profonde plutôt qu’un simple polish.

---

## 2. File map — tous les fichiers importants

### 2.1 Planet data / seeds / identity

- `src/domain/world/seeded-rng.ts`  
  - **Rôle**: hash FNV-1a, dérivation de seeds, RNG déterministe, utilitaires de tirage.  
  - **Importance**: **critique**.  
  - **Pourquoi**: c’est la racine de la stabilité des 500 planètes et des sous-seeds noise.

- `src/domain/world/planet-visual.types.ts`  
  - **Rôle**: contrat de données global (`PlanetIdentity`, `PlanetVisualDNA`, `PlanetRenderProfile`, `PlanetViewProfile`, etc.).  
  - **Importance**: **critique**.  
  - **Pourquoi**: définit les frontières entre identité, génération et rendu.

- `src/domain/world/generate-planet-visual-profile.ts`  
  - **Rôle**: génération canonique complète (famille, palette, classes, DNA, ring, scale, render profile, view profile).  
  - **Importance**: **critique**.  
  - **Pourquoi**: cœur fonctionnel du pipeline planète.

- `src/domain/world/build-galaxy-planet-manifest.ts`  
  - **Rôle**: génère les 500 planètes, calcule le layout galaxie, injecte positions monde, cache mémoire par seed.  
  - **Importance**: **critique**.  
  - **Pourquoi**: point de jonction génération planète <-> galaxie.

- `src/domain/world/resolve-planet-identity.ts`  
  - **Rôle**: résolution d’une planète par `planetId` depuis le manifeste canonique.  
  - **Importance**: **importante**.  
  - **Pourquoi**: garantit que Planet View reprend la même payload canonique que Galaxy View.

- `src/domain/world/world.constants.ts`  
  - **Rôle**: seed monde et config runtime layout (`planetCount: 500`, spacing, field radius).  
  - **Importance**: **importante**.  
  - **Pourquoi**: paramètre structurel de volumétrie et d’échelle globale.

### 2.2 Procedural generation / noise / masks

- `src/rendering/planet/terrain-noise.ts`  
  - **Rôle**: implémentation bruit 3D, fbm, ridged, craterField, sampling solid vs gaseous, génération des masks terrain.  
  - **Importance**: **critique**.  
  - **Pourquoi**: produit les champs procéduraux utilisés par géométrie + shaders.

- `src/rendering/planet/build-displaced-sphere.ts`  
  - **Rôle**: construit la sphère déplacée CPU + injecte tous les attributs custom de terrain.  
  - **Importance**: **critique**.  
  - **Pourquoi**: unique endroit où le relief affecte réellement la silhouette mesh.

### 2.3 Geometry / mesh / materials / shaders

- `src/rendering/planet/create-planet-render-instance.ts`  
  - **Rôle**: assemble group Three.js (surface/ocean/rings), contient tous les shaders GLSL inline, règle uniforms, animation rotation, debug snapshot, disposal.  
  - **Importance**: **critique**.  
  - **Pourquoi**: quasi-totalité du rendu planète est concentrée ici.

- `src/rendering/planet/types.ts`  
  - **Rôle**: interfaces d’entrée/sortie du renderer (`PlanetRenderInput`, options debug, instance).  
  - **Importance**: **importante**.  
  - **Pourquoi**: contrat entre UI et renderer.

- `src/ui/galaxy/planet-visual-scale.ts`  
  - **Rôle**: conversion `PlanetScaleProfile` -> rayon visuel galaxie, guardrails de lisibilité silhouette.  
  - **Importance**: **importante**.  
  - **Pourquoi**: maintient taille perceptible des planètes en galaxie.

### 2.4 Rendering pipeline / photometry / scene integration

- `src/rendering/planet/render-photometry.ts`  
  - **Rôle**: paramètres color space, tone mapping, expositions galaxie vs planète.  
  - **Importance**: **importante**.  
  - **Pourquoi**: impact direct sur rendu final perçu.

- `src/rendering/space/create-starfield.ts`  
  - **Rôle**: starfield + nébuleuse de fond.  
  - **Importance**: **secondaire** (pour pipeline planète strict).  
  - **Pourquoi**: influence le contexte visuel, pas la génération planète.

### 2.5 Galaxy view

- `src/ui/galaxy/GalaxyView.tsx`  
  - **Rôle**: scène galaxie, camera ortho, batching d’instanciation, culling de perf, instancing des tiny planets, navigation vers Planet View.  
  - **Importance**: **critique**.  
  - **Pourquoi**: encode la stratégie d’affichage de masse des ~500 planètes.

- `src/ui/galaxy/GalaxyHud.tsx`  
  - **Rôle**: HUD galaxie.  
  - **Importance**: **secondaire**.  
  - **Pourquoi**: peu lié au cœur génération/rendu planète.

- `app/galaxy/page.tsx`  
  - **Rôle**: entrypoint route galaxie.  
  - **Importance**: **secondaire**.  
  - **Pourquoi**: montage de vue.

### 2.6 Planet view

- `src/ui/planet/PlanetView.tsx`  
  - **Rôle**: résolution planète, scène dédiée, caméra perspective + orbit controls, rendu HQ (mode `planet`).  
  - **Importance**: **critique**.  
  - **Pourquoi**: pipeline d’inspection détaillée d’une planète.

- `app/planet/[planetId]/page.tsx`  
  - **Rôle**: route d’entrée Planet View.  
  - **Importance**: **secondaire**.

### 2.7 Validation / debug / visual QA

- `src/ui/planet/PlanetValidationView.tsx`  
  - **Rôle**: vue de validation A/B pour comparer mode galaxie vs planète sur une même planète.  
  - **Importance**: **importante**.  
  - **Pourquoi**: outil direct pour vérifier cohérence inter-vues.

- `app/validation/[planetId]/page.tsx`  
  - **Rôle**: route de validation mode query param.  
  - **Importance**: **secondaire**.

- `scripts/capture-visual-validation.ts`  
  - **Rôle**: captures Playwright de familles en galaxy+planet + génération planche de validation.  
  - **Importance**: **importante**.  
  - **Pourquoi**: support QA visuelle systématique du pipeline.

- `scripts/capture-before-after.ts`  
  - **Rôle**: captures comparaison before/after entre deux builds.  
  - **Importance**: **importante**.  
  - **Pourquoi**: support refonte/régression visuelle.

### 2.8 Tests directement liés au pipeline planète

- `tests/planet-visual-profile.test.ts` — déterminisme + guardrails rayon. (**important**)  
- `tests/planet-identity-rules.test.ts` — invariants identité canonique. (**important**)  
- `tests/planet-procedural-uniforms.test.ts` — stabilité mapping render/layers. (**important**)  
- `tests/planet-render-lod.test.ts` — séparation budgets galaxy/planet. (**important**)  
- `tests/planet-render-appearance.test.ts` — instanciation renderer. (**important**)  
- `tests/planet-engine-guardrails.test.ts` — seuil silhouette min. (**important**)  
- `tests/planet-resolution.test.ts` — cohérence manifeste vs resolve. (**important**)  
- `tests/galaxy-planet-visual-scale.test.ts` — cohérence visual radius galaxie. (**important**)

---

## 3. Runtime pipeline réel

### Étape 1 — Origine seed / identité de base

- **Entrées**: `WORLD_SEED` constant + `planetId` (route) ou index planète (manifeste).  
- **Fichiers/fonctions**:  
  - `world.constants.ts` (`WORLD_SEED`, `planetCount=500`)  
  - `build-galaxy-planet-manifest.ts` (`planetSeed: planet-{index}`)  
- **Sortie**: tuples (`worldSeed`, `planetSeed`, `planetId`) pour chaque planète.
- **Couplage notable**: convention d’ID/seed indexée (`planet-{index}`) hardcodée à plusieurs endroits.

### Étape 2 — Canonical seed et sélection de recette

- **Fonction**: `generateCanonicalPlanet(input)` dans `generate-planet-visual-profile.ts`.  
- **Process**: `canonicalSeed = deriveSeed(worldSeed::planetSeed, 'planet-canonical-v2')`, puis RNG seedé.  
- **Sortie**: `FamilyRecipe`, `radiusClass`, palette, paramètres initiaux.
- **Couplage**: logique design (poids de familles, ranges visuels) embarquée en dur dans un gros tableau `FAMILY_RECIPES`.

### Étape 3 — Construction identité / classification / visual DNA

- **Fonctions**: bloc principal `generateCanonicalPlanet` + helpers (`pickRadiusClass`, `jitterColor`, `blendHsl`).  
- **Données entrantes**: recipe + RNG + input seed/position.  
- **Données sortantes**:  
  - `PlanetIdentity` (id, seeds, family, radiusClass, worldPosition)  
  - `PlanetClassification`  
  - `PlanetVisualDNA` (couleurs, couvertures, densités, noiseSeeds, rotation)
- **Couplage problématique**: identity gameplay et identité visuelle cohabitent dans la même fonction/fichier, sans module “domain identity” séparé.

### Étape 4 — Mapping vers profil de rendu

- **Fonctions**: `buildScaleProfile`, puis construction `PlanetRenderProfile` dans `generateCanonicalPlanet`.  
- **Sortie**: `render.surface`, `render.clouds`, `render.atmosphere`, `render.rings`, `scale`.  
- **Couplage**: même si clouds/atmo sont définis, activation finale dépend d’un autre endroit (`createPlanetViewProfile`), donc la donnée et l’exécution sont découplées de manière implicite.

### Étape 5 — Génération des 500 planètes + layout galaxie

- **Fonctions**:  
  - `buildGalaxyPlanetManifest` génère N planètes (N=500)  
  - `generateGalaxyLayout` place les planètes avec spacing basé sur rayon estimé
- **Sortie**: manifeste avec `planet` canonique + position `(x,y)` + rayon visuel.  
- **Couplage notable**: le layout dépend de `silhouetteProtectedRadius`, donc les choix de scale visuel influencent directement la distribution spatiale galaxie.

### Étape 6 — Résolution d’une planète pour Planet View

- **Fonction**: `resolvePlanetIdentity(worldSeed, planetId)`  
- **Entrée**: id depuis route `/planet/[planetId]`  
- **Sortie**: payload canonique de la planète trouvée (ou null).
- **Couplage**: résolution linéaire via `find` sur manifeste en cache; simple mais O(n).

### Étape 7 — Création instance de rendu

- **Fonction**: `createPlanetRenderInstance(input)`  
- **Entrées**: `CanonicalPlanet`, position, `viewMode`.  
- **Process**:  
  1. `createPlanetViewProfile(viewMode)` pour segments/features  
  2. surface mesh (HQ = displaced sphere + shader planète, LQ = sphere simple + shader galaxie)  
  3. ring mesh éventuel  
  4. ocean/cloud/atmo seulement si flags actifs (actuellement faux)
- **Sortie**: `PlanetRenderInstance` avec `object`, `dispose`, `debugSnapshot`.
- **Couplage**: shaders, logique de layering, LOD et debug sont tous dans le même fichier.

### Étape 8 — Génération géométrique / terrain réel

- **Fonctions**: `buildDisplacedSphereGeometry` + `sampleTerrain`  
- **Entrées**: seeds surface/moisture/thermal, oceanLevel, reliefAmplitude, family, surfaceModel.  
- **Process**: sampling par vertex, displacement radial, injection de 12 attributs personnalisés.  
- **Sortie**: `THREE.SphereGeometry` déplacée + attributs buffer.
- **Couplage**: terrain noise dépend de paramètres render (ex `oceanLevel`, `bandingStrength`) plutôt que d’un bloc géologie dédié.

### Étape 9 — Intégration scène et animation runtime

- **Planet View (`PlanetView.tsx`)**: caméra perspective, orbit controls, render loop, `updatePlanetLayerAnimation` (rotation selon `rotationSpeed`).  
- **Galaxy View (`GalaxyView.tsx`)**: caméra orthographique, batching de création, instancing tiny planets, interactions pan/keyboard/double-click.
- **Sortie**: rendu temps réel + navigation `/planet/:id`.

### Étape 10 — Destruction / cache / régénération

- **Disposal**: `instance.dispose()` + dispose scene mesh/material dans vues.  
- **Cache**: `MANIFEST_CACHE` global en mémoire par seed (sans éviction).  
- **Régénération**: uniquement si seed différente ou reload process.
- **Risque**: cache potentiellement non borné si multi-seeds en session longue.

---

## 4. Planet identity system

### 4.1 Ce qui existe réellement

- Seed source: `worldSeed` + `planetSeed`, dérivée par `deriveSeed` avec label versionné (`planet-canonical-v2`).  
- Déterminisme: oui (tests dédiés le valident).  
- Variables identitaires actuelles: `planetId`, `planetSeed`, `worldSeed`, `canonicalSeed`, `family`, `radiusClass`, `worldPosition`.  
- Variables visuelles dérivées: palette, couleurs, ocean/cloud coverage, atmosphere density, roughness/specular/emissive/banding, sous-seeds noise, rotation.

### 4.2 Stabilité déterministe

- Très bonne pour la planète elle-même (génération canonique stable).  
- Moins bonne pour la scène globale de fond (starfield non seedé).  
- Position monde de la planète est injectée après layout (mutation `current.identity.worldPosition = ...`).

### 4.3 Séparation gameplay vs visuel

- **Partiellement séparée**, pas proprement découplée.  
- `PlanetIdentity` existe, mais `generateCanonicalPlanet` mélange dans le même flux: identité “métier”, classification et tuning rendu.  
- Pas de module “identity rules” indépendant du rendu.

### 4.4 Archétypes / palettes / anti-similarité

- Archétypes = `FamilyRecipe` pondérées (9 familles).  
- Palette = 2 presets/famille en général + jitter couleur + blend HSL.  
- Variation = ranges numériques + noise seeds.  
- Anti-similarité explicite globale (distance perceptuelle entre planètes): **absente**.

### 4.5 Verdict identité

**Bien pensé**:
- Seed pipeline simple, stable, testable.
- Contrats TypeScript clairs.
- Recettes de famille lisibles et extensibles.

**Bricolé / fragile**:
- Huge config in-code monolithique.
- Mélange responsabilité “identity/design/render”.
- Mutation post-génération de `worldPosition`.

**Ce qui manque pour 500 planètes distinctes et cohérentes**:
- métriques de diversité inter-planètes (anti-collision perceptuelle),
- séparation stricte “identity canonique” vs “visual realization par vue”,
- taxonomie biomes/traits plus structurée que ranges continues + jitter.

---

## 5. Geometry / mesh audit

- Primitive de base: `THREE.SphereGeometry`.  
- Construction sphère: segments selon vue (`~12-16` galaxie, `160` planète).  
- Relief géométrique: **oui**, displacement CPU radial dans `buildDisplacedSphereGeometry`.  
- Silhouette: **oui**, change réellement (hors familles océaniques où les zones marines sont quasi verrouillées à `radius * 0.998`).  
- Tessellation: suffisante pour prototype desktop en vue planète; trop limitée pour close-up premium (pas micro-détails multi-fréquence géométriques).  
- LOD futur: partiellement compatible (profiles existent), mais implémentation actuelle est binaire mode-based, pas distance/streaming LOD.  
- CPU vs GPU: géométrie générée côté CPU, shader ne fait pas de displacement vertex dynamique.  
- Attributs custom: nombreux et pertinents (12 masks), bonne base pour matériaux avancés.

### Conséquences

- Positif: silhouette non fake + shading riche car données terrain disponibles par vertex.  
- Négatif: coût CPU/GC potentiellement fort lors instanciation massive non-instanced; aucune tessellation adaptative; fidélité limitée par résolution fixe de sphère.

---

## 6. Shader / material audit

### Shaders réellement présents

- Surface galaxy: `SURFACE_FRAGMENT_SHADER_GALAXY` (simplifié, procedural en shader via `n3`).  
- Surface planet: `SURFACE_FRAGMENT_SHADER_PLANET` (utilise attributs terrain).  
- Vertex surface: `SURFACE_VERTEX_SHADER` (passe tous les attributs).  
- Ocean: `OCEAN_FRAGMENT_SHADER` + vertex partagé.  
- Rings: `RING_VERTEX_SHADER` + `RING_FRAGMENT_SHADER`.

### Uniforms / passage de données

- Uniforms injectés via `ShaderMaterial` dans `createPlanetRenderInstance` (`uColor*`, `uEmissive`, `uSurfaceModel`, `uSeed`, `uLightingBoost`, etc.).  
- Terrain détaillé passe majoritairement par attributs vertex (`a*Mask`) vers varyings.

### Où sont calculés les effets

- Relief visuel: principalement fragment surface planet via `vHeight/vMountainMask`; relief géométrique en amont CPU.  
- Biomes: fragment surface planet (température/humidité/continent).  
- Eau: blending ocean/land dans shader surface + layer ocean séparée disponible mais désactivée.  
- Roche/glace: implicites par palettes + biometint, pas système matériau physiquement séparé.  
- Atmosphère: paramètres existent, couche non rendue actuellement.  
- Halo: non implémenté explicitement (hors rim lighting local).  
- Nuages: paramètres générés, couche non rendue.  
- Lumière: modèle stylisé (hémisphère + rim + spec hotspot fixe), non PBR complet.  
- Fresnel: présent de façon stylisée (rim/fresnel-like), pas pipeline physically based.

### Modularité

- **Monolithique**: shaders inline dans un seul fichier TS + responsabilité de création des meshes.  
- Faible réutilisabilité/composabilité (pas de chunks GLSL modulaires, pas de graph).

### Verdict

**Propre**:
- Passage cohérent des données procédurales au shader.
- Séparation shader galaxy/planet claire.

**Fragile**:
- Shader planet trop chargé en responsabilités.
- Features prêtes mais non activées (clouds/atmo/ocean layer) créent dette “latent code”.

**Bloquant premium**:
- absence de pipeline matériaux stratifié/PBR,
- absence de lighting model stellaire robuste,
- absence de modularité shader (difficile d’ajouter des couches haut de gamme sans explosion de complexité).

---

## 7. Noise / masks / procedural logic audit

### Ce qui existe techniquement

- Noise de base: value noise 3D interpolé (`noise3`).  
- FBM: oui (`fbm`, octaves paramétrables).  
- Ridged: oui (`ridged`) pour chaînes montagneuses.  
- Craters: oui (`craterField`).  
- Masques présents: continents, montagnes, coasts, oceanDepth, humidité, température, érosion, cratère, thermique, bandes gaz.

### Limites structurelles

- Pas de simulation géologique/tectonique/érosion physique; c’est une synthèse noise-driven.  
- Biomes fortement dépendants height+humidity+temperature simplifiés.  
- Pas de système explicite moisture transport, vents, drainage, bassins, etc.

### Lecture visuelle

- Résultat lisible et varié pour prototype stylisé.  
- Sur longue série (500), risque de “signature noise répétée” faute de macro-structures géologiques distinctives par famille.

### Couplage

- Couplage fort noise <-> shader via attributs et interprétation directe.  
- Couplage noise <-> render profile (oceanLevel/bandingStrength) plutôt que via un modèle de terrain autonome.

---

## 8. Galaxy View vs Planet View

### Réalité actuelle

- C’est **la même planète canonique** (même `CanonicalPlanet`) dans les deux vues.  
- Ce ne sont pas deux contenus de données séparés.

### Ce qui est partagé

- Seeds, identité, classification, visualDNA, render profile.  
- Fonction d’assemblage `createPlanetRenderInstance`.

### Ce qui diverge

- `viewMode` pilote segments, shader utilisé (galaxy vs planet), exposition tone mapping, camera type.  
- Galaxy peut remplacer une partie des planètes par instancing couleur unie (pas de shader planète détaillé).

### Duplication / incohérences possibles

- Duplication limitée côté données (bon point).  
- Incohérence visuelle potentielle pour tiny planets instanced vs version détaillée Planet View.  
- Clouds/atmo désactivés partout, donc pas d’incohérence sur ces couches (car absentes).

### Verdict cohérence inter-vues

- Cohérence identitaire: bonne.  
- Cohérence de rendu perçu: moyenne (dégradations agressives en galaxie pour perf).

---

## 9. Performance / scalability audit

### Contexte 500 planètes

- Génération: manifeste 500 planètes en mémoire + cache global par seed.  
- Rendu galaxie: batching + queue microtask + seuil instancing petites planètes.

### Coûts observables

- **CPU**:
  - génération canonique 500x au build manifeste,
  - displacement géométrique CPU coûteux pour planètes détaillées non-instanced.
- **GPU**:
  - shader surface planète relativement chargé,
  - anneaux transparents peuvent coûter en overdraw.
- **Mémoire**:
  - manifeste complet + objets CanonicalPlanet + géométries/materials créés puis disposés,
  - cache manifeste non évicté.
- **Textures**:
  - pas de grosses textures planétaires, bon point mémoire/IO.

### Ce qui est recalculé / caché

- Manifeste mis en cache (bien).  
- Géométries runtime recréées à chaque instanciation (normal, mais coûteux).  
- Pas de cache géométrique partagé par signature planète.

### Goulots probables

- montée charge quand beaucoup de planètes “non tiny” doivent être instanciées avec géométrie/shader,  
- shader monolithique en vue planète sur GPU faibles,  
- absence de LOD dynamique en zoom Planet View.

### Mobile / laptop moyen

- Galaxy: stratégie actuelle (instancing + batch) aide fortement.  
- Planet View: risque de coût élevé sur iGPU/mobile si on active clouds/atmo sans refonte.  
- Sans optimisation supplémentaire, pipeline actuel est **passable desktop moyen, risqué mobile ambitieux**.

---

## 10. Code quality / architecture audit

### Séparation responsabilités

- Bonne séparation macro Domain vs Rendering vs UI.  
- Mauvaise séparation micro dans fichiers clés (`generate-planet-visual-profile.ts`, `create-planet-render-instance.ts` trop centraux).

### Couplage / lisibilité

- Types bien définis, lisibilité correcte.  
- Couplage fort par “god files” et constantes inline nombreuses.

### Duplication / dette

- Peu de duplication brute.  
- Dette surtout structurelle: features préparées mais désactivées, shader monolithique, config design en dur.

### Rigidité

- Difficile d’introduire une refonte matériaux/shader modulaire sans découpage préalable.  
- Difficile de faire évoluer indépendamment identité gameplay vs rendu.

### À conserver

- système seed déterministe,
- contrats types,
- manifeste/caching,
- base noise terrain + attributs vertex,
- stratégie de perf galaxie (batch/instancing) comme base.

### À réécrire ou refactorer fortement

- orchestration shader/material,
- activation/cycle de vie des couches (clouds/atmo/ocean),
- architecture de LOD,
- séparation config design vs code runtime.

---

## 11. Missing pieces for target quality

### Manques géométriques

- LOD géométrique progressif distance-based.  
- Micro/macro displacement hiérarchique plus riche.  
- Silhouette premium (chaînes, bassins, structures géologiques plus distinctes).

### Manques procéduraux

- Modèle biome plus structuré (climat, humidité transportée, zones tectoniques).  
- Contrôle anti-similarité global pour 500 planètes.  
- Features planétaires distinctives (formations signatures par famille).

### Manques shader

- Modularisation shader (chunks/layers).  
- Pipeline lumière plus physique/cohérent (source stellaire, phases, night side).  
- Système atmosphère/nuages réellement actif et intégré.

### Manques matériaux

- Approche matériau stratifiée (roche/sable/glace/liquide) plus explicite.  
- Paramètres physiques plus cohérents (roughness/specular/emissive par couche réelle).

### Manques identité visuelle

- “Visual language” inter-familles plus discriminant.  
- Contraintes d’unicité perceptuelle à l’échelle 500 objets.

### Manques perf / LOD

- Cache géométrique/mesh par signature si utile.  
- LOD shader / feature toggles progressifs en Planet View.  
- Stratégie explicitement pensée mobile-tier.

### Manques architecture

- Découplage identity -> procedural world model -> render realization.  
- Extraction des configs famille/palettes en assets data versionnés.  
- Gouvernance claire des flags de couche (éviter code dormant permanent).

---

## 12. Refactor readiness verdict

- **Base saine ?** Oui, partiellement: la fondation déterministe est solide, testée, et suffisamment propre pour servir de socle.  
- **Forte amélioration sans réécriture lourde ?** Limitée: on peut améliorer localement, mais le plafond est vite atteint avec l’architecture shader monolithique actuelle.  
- **Refonte partielle ou structurelle ?** Refonte **partielle structurelle** recommandée (pas full rewrite, mais refactor profond des couches rendering/procedural boundaries).  
- **À préserver absolument**: seed system, types canonique, manifeste/caching, terrain masks, perf galaxy batching/instancing.  
- **À remplacer probablement**: orchestration shader/material actuelle, stratégie LOD rigide, activation de couches via flags figés, découpage responsabilités des “god files”.

Conclusion tranchée: **la base données/procédural est exploitable, mais le pipeline de rendu doit être restructuré sérieusement pour atteindre un rendu planète premium maintenable**.

---

## 13. Appendix — code evidence

### Fonctions clés

- `generateCanonicalPlanet(...)` : génération canonique complète.  
- `buildGalaxyPlanetManifest(...)` / `getGalaxyPlanetManifest(...)` : génération+cache des 500 planètes.  
- `sampleTerrain(...)` (`sampleSolid`, `sampleGaseous`) : logique procédurale terrain.  
- `buildDisplacedSphereGeometry(...)` : displacement mesh + attributs custom.  
- `createPlanetRenderInstance(...)` : assemblage rendu final.

### Types clés

- `PlanetIdentity`, `PlanetClassification`, `PlanetVisualDNA`, `PlanetRenderProfile`, `PlanetScaleProfile`, `PlanetViewProfile`, `CanonicalPlanet`.

### Constantes clés

- `WORLD_SEED = 'coinage-mvp-seed'`.  
- `GALAXY_LAYOUT_RUNTIME_CONFIG.planetCount = 500`.  
- `MIN_RENDER_RADIUS = 2.8`, `MAX_RENDER_RADIUS = 5.9`.  
- `INSTANCED_RADIUS_THRESHOLD = 4.4` (galaxy tiny planets).

### Uniforms clés

- Surface: `uColorDeep`, `uColorMid`, `uColorHigh`, `uOceanColor`, `uAccentColor`, `uEmissive`, `uSurfaceModel`, `uSeed`, `uLightingBoost`, `uShadingContrast`.  
- Ocean: `uOceanColor`, `uOceanDeepColor`, `uShadingContrast`, `uLightingBoost`.  
- Rings: `uColor`, `uOpacity`, `uSeed`, `uShadingContrast`.

### Attributs mesh clés

`aHeight`, `aLandMask`, `aMountainMask`, `aCoastMask`, `aOceanDepth`, `aContinentMask`, `aHumidityMask`, `aTemperatureMask`, `aErosionMask`, `aCraterMask`, `aThermalMask`, `aBandMask`.

### Shaders clés

- `SURFACE_FRAGMENT_SHADER_GALAXY` (stylisé simplifié).  
- `SURFACE_FRAGMENT_SHADER_PLANET` (biomes/relief détaillé).  
- `OCEAN_FRAGMENT_SHADER`, `RING_FRAGMENT_SHADER`.

### TODO / FIXME liés planète

- Aucun `TODO`/`FIXME` explicite détecté dans les fichiers cœur planète.  
- Dette implicite observée: couches clouds/atmosphere/ocean profilées mais désactivées par configuration de vue.

### Extraits révélateurs (courts)

```ts
// createPlanetViewProfile -> fonctionnalités visuelles désactivées
enableClouds: false,
enableAtmosphere: false,
enableOceanLayer: false,
```

=> Le pipeline de données prépare ces couches, mais le rendu actuel ne les active pas.

```ts
// tiny planets en galaxie: fallback instanced couleur unie
tinyPlanetMesh.setColorAt(tinyPlanetIndex, new THREE.Color(...colorMid));
```

=> Très bon pour performance, mais identité matériau fortement simplifiée.

```ts
// displacement réel côté CPU
position.setXYZ(i, px * displacedRadius, py * displacedRadius, pz * displacedRadius);
```

=> La silhouette évolue réellement selon terrain sample.

---

## Questions ouvertes à trancher

1. Souhaite-t-on conserver le principe “même planète canonique, deux shaders de vue”, ou introduire une représentation intermédiaire multi-LOD explicitement versionnée ?  
2. L’instancing des tiny planets doit-il refléter davantage l’identité visuelle (ex. palette 2-3 tons) ou rester minimaliste perf-first ?  
3. Clouds/atmosphere doivent-ils être activés progressivement en production, ou réimplémentés proprement dans une architecture shader modulaire avant activation ?  
4. Le système `FAMILY_RECIPES` reste-t-il hardcodé TypeScript, ou migre-t-il vers des data assets validés/outillés ?  
5. Veut-on un modèle d’éclairage stylisé assumé, ou une direction PBR/physique plus stricte pour la refonte ?

## 14. Recommended next inputs for design review

Pour qu’un autre modèle propose une refonte robuste, fournir ensuite:

1. **Captures comparatives standardisées** (même set de planètes, galaxy + planet) issues de `scripts/capture-visual-validation.ts`.  
2. **Board before/after** via `scripts/capture-before-after.ts` sur un échantillon représentatif par famille.  
3. **Vidéo courte de navigation** (galaxy pan/zoom + transition vers planet view) pour juger cohérence dynamique.  
4. **Dump JSON de quelques `CanonicalPlanet`** (au moins 3 par famille) pour analyser variabilité réelle des paramètres.  
5. **Mesures perf terrain réel** (desktop moyen + laptop iGPU): frame time, draw calls, triangles, memory.  
6. **Références visuelles cibles** (direction art) avec annotations “must-have / nice-to-have”.  
7. **Décision produit explicite** sur mobile target (support plein, dégradé, ou non support).  
8. **Priorités de refonte ordonnées** (ex. cohérence identité > atmosphère > premium shading > LOD).  
9. **Contrainte budget technique** (temps d’implémentation + risque acceptable) pour arbitrer refactor partiel vs profond.

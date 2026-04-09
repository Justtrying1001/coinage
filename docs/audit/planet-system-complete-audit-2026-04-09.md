# Audit système planète complet — 2026-04-09

## Périmètre et méthode
- Lecture complète des chemins runtime Galaxy et Planet (UI, génération, rendu, vendor Xenoverse).
- Vérification build/test/typecheck et inspection de la pipeline de génération.
- Instrumentation ad hoc en Node (échantillonnage d'élévation) pour valider la cohérence `min/max`, distribution des élévations et relation avec `oceanLevel`.

Commandes exécutées:
- `npm run typecheck`
- `npm test`
- `npm run build`
- `node --import tsx -e "... sampleXenoElevation ..."`

---

## BLOC 1 — Architecture réelle actuelle

### Organisation générale
- **Galaxy View** est montée via `app/galaxy/page.tsx` → `GalaxyView` avec `WORLD_SEED` global. Elle fabrique une scène orthographique 2D (z fixe), un starfield/nebula, et des proxies de planètes cliquables. 
- **Planet View** est montée via `app/planet/[planetId]/page.tsx` → `PlanetView`; elle résout une planète via manifest, puis construit un rendu détaillé via le module vendorisé Xenoverse (`createXenoversePlanetGpuInstance`).
- **Validation View** (`/validation/[planetId]`) utilise encore le renderer local historique `createPlanetRenderInstance`, distinct du chemin runtime Planet réel.

### Séparation des responsabilités
- **Données canoniques**: `generateCanonicalPlanet`, `buildGalaxyPlanetManifest`, `resolvePlanetIdentity`.
- **Galaxy render simplifié**: `createPlanetProxyInstance` (MeshStandardMaterial + sphere simple).
- **Planet render détaillé (runtime réel)**: `vendor/xenoverse/planet-gpu.ts` + `terrain-face.ts` + `compute/vertex-compute.ts` + shaders surface communs.
- **Chemin local historique**: `createPlanetRenderInstance` + `buildDisplacedSphereGeometry` (utilisé par Validation uniquement).

### Ambiguïtés / chemins concurrents
- Deux moteurs de rendu détaillé coexistent encore: **vendor Xenoverse face-based** (PlanetView réel) et **renderer local displaced sphere** (Validation).
- Le fichier `createGalaxyPlanetProxy` existe dans `GalaxyView.tsx` mais n'est plus utilisé (doublon technique avec `createPlanetProxyInstance`).
- La notion “canonique” est claire côté data (manifest/canonical planet), mais **pas encore unifiée côté renderer détaillé**.

---

## BLOC 2 — Flux complet de données et rendu

### Flux commun seed → planète
1. `WORLD_SEED` constant injecté depuis les pages app.
2. `buildGalaxyPlanetManifest(worldSeed)` génère `planet-0..planet-n` via `generateCanonicalPlanet` + layout déterministe.
3. Chaque entrée manifest contient position XY + `CanonicalPlanet` complet (identity/classification/visualDNA/render).
4. `resolvePlanetIdentity` relit ce même manifest et renvoie l'objet canonique pour Planet View.

### Flux Galaxy
- `GalaxyView` lit le manifest, instancie des proxies via `createPlanetProxyInstance`.
- Rayon proxy = `silhouetteProtectedRadius` (via scale profil), matériau `MeshStandardMaterial`, couleur mid/deep.
- Caméra orthographique + ambient/directional lights + interactions (drag + keyboard + dblclick vers `/planet/[id]`).

### Flux Planet (runtime navigateur réel)
- `PlanetView` résout la planète canonique puis appelle `createXenoversePlanetGpuInstance`.
- Assemblage 6 faces cube-sphere (`terrain-face`) avec tentative compute GPU par face (`runVertexComputeFace`), fallback CPU sur exception/non support.
- `MinMax` global agrège les élévations unscaled de toutes les faces, puis est injecté dans `uMinMax` des matériaux shader.
- Shader surface + atmosphere ajoutés, fit caméra calculé par bounding sphere, lighting mis à jour à chaque frame.

### Point critique du flux
- Le renderer/shader attend `uSeaLevel` en espace élévation unscaled, **mais la valeur est forcée à `0.0`** dans les deux renderers, alors que le domaine canoniquement généré est très souvent décalé et `oceanLevel` généré est dans [0.14..0.94].

---

## BLOC 3 — Audit Galaxy View

### Fonction réelle
- Objectif observé: vue macro lisible, navigation rapide, sélection de planète.
- Niveau de simplification actuel: sphères standard peu détaillées, rotation lente, éclairage basique.

### Proxy planète
- Géométrie: sphere 20x20 segments (uniforme pour toutes planètes).
- Taille: `silhouetteProtectedRadius` (clampé via scale profile).
- Couleur: dérivée de `surface.colorMid` + emissive basé sur `colorDeep`.

### Qualité visuelle (jugement honnête)
- **Fonctionnelle techniquement, mais visuellement faible**: rendu “placeholder”, faible richesse de matériau, faible variété perceptuelle, lecture des familles limitée.
- Cohérence avec Planet View: partielle sur taille relative/seed, **faible sur identité de matière** (proxy trop générique).

### Problèmes techniques
- Densité et cadrage globalement stables (layout + ortho + clamps).
- Contraste matière/éclairage limité: light rig simple, material unique.
- Doublon de code proxy dans `GalaxyView.tsx` (dette).

---

## BLOC 4 — Audit Planet View

### Pipeline réellement utilisée
- Runtime réel Planet: `PlanetView` → `createXenoversePlanetGpuInstance` (vendor) → `buildTerrainFaceGeometry` → compute path si possible sinon CPU.
- Ce chemin est distinct de `createPlanetRenderInstance` (non utilisé par PlanetView de prod).

### Conformité Xenoverse (honnête)
- **Partielle**.
- Fidèle: architecture cube-face, min/max global, couche atmosphère, shader gradient par élévation, tentative compute par face.
- Divergences majeures:
  - compute WebGL2 readback custom simplifié (pas pipeline Xenoverse complet).
  - shading/matériaux encore adaptés localement.
  - ocean/sea-level mapping non aligné avec la génération canonique.
  - path local legacy encore présent en parallèle.

### Cause précise de la planète sombre / quasi noire
Causes observées et vérifiées:
1. **Palette/shader structurellement sombres**: gradients `baseLand/baseDepth` sont faibles en luminance; tonemapping neutral + exposure 1.0 n'aide pas.
2. **`uSeaLevel` incohérent (forcé à 0.0)** alors que distribution réelle d'élévation est souvent proche de [-0.1, 0.5] et que `oceanLevel` canonique est souvent élevée (ex: 0.57, 0.94, etc.). Résultat: classification terre/eau incohérente et rendu chromatique dégradé.
3. **Éclairage minimaliste** (ambient 0.45 + directional 1.18) avec modèle spec/diffuse simple: produit une planète globalement terne.
4. **Compute fallback implicite**: si WebGL2 float readback indisponible, CPU fallback silencieux (warning dev seulement), ce qui complique le diagnostic de variations runtime.

Ce n'est **pas** principalement un problème de mesh manquant/caméra/frustum: la géométrie est bien construite et cadrée.

### Qualité visuelle (jugement honnête)
- **Non acceptable actuellement** pour l'objectif “niveau Xenoverse”.
- Techniquement “ça rend”, mais le résultat est inabouti: trop sombre, trop plat, pas assez crédible.

---

## BLOC 5 — Comparaison Galaxy vs Planet

- Cohérence data/ID/seed: bonne (même planète canonique).
- Cohérence visuelle: faible à moyenne.
  - Galaxy = proxy très simplifié, stylé “placeholder”.
  - Planet = tentative détaillée mais shading fragile/sombre.
- Aujourd'hui, ce ne sont pas deux niveaux d'un même système visuel abouti; ce sont deux paliers encore hétérogènes.

---

## BLOC 6 — Problèmes exacts identifiés

1. **Dual renderer détaillé concurrent** (vendor réel vs renderer local validation).
2. **Mismatch sea-level** entre génération canonique et shader (`uSeaLevel=0.0` hardcodé).
3. **Photométrie trop conservatrice** (`planetExposure=1.0`, neutral tone mapping) vs palettes sombres.
4. **Compute path non robuste cross-platform** (dépend WebGL2 + float readback, fallback peu explicité en prod).
5. **Galaxy proxies trop basiques** pour l'identité visuelle attendue.
6. **Dette de code** (fonction proxy locale inutilisée, chemins historiques encore actifs).
7. **Tests visuels insuffisants**: tests actuels valident surtout déterminisme/guardrails, pas la qualité photométrique runtime.

---

## BLOC 7 — Dette technique classée

### Critique
- Alignement génération ↔ shader sur `seaLevel`/domain elevation.
- Unification du renderer détaillé (choisir un seul chemin canonique runtime + validation).
- Observabilité compute/fallback (signal clair en prod/dev).

### Important
- Rework photométrie Planet (exposure, rig de lumière, paramètres matériau/shader).
- Rework proxy Galaxy pour cohérence visuelle avec familles planétaires.
- Renforcement tests de non-régression visuelle (captures, histogrammes, luminance guards).

### Secondaire
- Nettoyage fonctions/chemins morts.
- Nommage/structuration vendor/local pour réduire ambiguïtés.

---

## BLOC 8 — Plan de correction recommandé

1. **Stabiliser le contrat de données de shading**
   - Décider et documenter l'espace de `uSeaLevel` (unscaled normalized vs world scale).
   - Injecter `uSeaLevel` depuis `planet.render.surface.oceanLevel` après conversion cohérente avec `uMinMax`.
2. **Unifier le chemin Planet détaillé**
   - Garder `createXenoversePlanetGpuInstance` comme canonique.
   - Rebaser Validation sur ce chemin (ou supprimer l'ancien renderer).
3. **Corriger la photométrie Planet**
   - Ajuster exposure/tone mapping + light rig + courbe diffuse/spec pour éviter rendu bouché.
4. **Rendre explicite compute vs fallback**
   - Afficher statut face compute/fallback (compteur, raisons) dans debug HUD/log.
5. **Améliorer Galaxy proxy**
   - Matériaux/variantes plus riches, cohérence palette/famille, meilleure lisibilité macro.
6. **Ajouter tests visuels automatiques**
   - Baselines de luminance moyenne, contraste min, et snapshots par familles.

---

## BLOC 9 — Verdict honnête

- **Architecture**: partiellement saine côté data canonique, encore ambiguë côté rendu détaillé.
- **Rendu**: fonctionne techniquement mais qualité visuelle insuffisante (Galaxy trop basique, Planet trop sombre/terne).
- **Conformité Xenoverse**: partielle, pas full parity.
- **Stabilité**: build/typecheck/tests OK, mais robustesse runtime rendering encore incomplète (compute fallback, contrat shader).

Verdict global: **système planète en état intermédiaire, non finalisable visuellement en l'état sans correction structurelle du contrat shading + unification du chemin renderer + recalibrage photométrique.**

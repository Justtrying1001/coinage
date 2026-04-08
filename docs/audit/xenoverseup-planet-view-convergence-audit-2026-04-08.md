# Audit de convergence Planet View -> XenoverseUp (2026-04-08)

## BLOC 1 — Notre pipeline actuel
Ce qu’on fait actuellement, et où ça diverge déjà de XenoverseUp.

### 1) Géométrie active
- Nous générons déjà une **cube-sphere face-based** (6 faces `FACE_DIRS`, base locale `axisA/axisB`, projection `normalize`) puis triangulation par grille par face. C’est bien la même famille de méthode que XenoverseUp.  
- Mais notre résolution est dérivée d’un concept LOD maison (`segments/2`) plutôt qu’un paramètre de résolution explicite pilotant le générateur de face comme dans XenoverseUp.  
- Nous poussons beaucoup plus d’attributs de vertex (elevation + multiples masks climatiques/biomes), alors que XenoverseUp transporte essentiellement l’élévation (et min/max) comme donnée centrale.

### 2) Génération du relief / champs terrain
- Notre relief est généré dans `sampleTerrainFields` via `fbm + ridged + biais famille + humidité/température/thermique` avec presets famille.  
- Nous avons une logique de **familles gameplay** très forte (lush/oceanic/desert/ice/volcanic/...), qui injecte des biais dans le relief et les masques (snow/lava/rock/sediment).  
- Le pipeline terrain est donc un générateur “multi-champs stylisé” orienté direction artistique et taxonomy, pas un pipeline “noise layer stack explicite” à la XenoverseUp.

### 3) Pipeline data -> geometry -> render
- Data terrain calculée CPU par sommet, écrite dans de multiples attributs (`aElevation`, `aWaterMask`, `aSlopeMask`, `aHumidityMask`, etc.), puis consommée dans un gros shader surface.
- On n’a pas de pipeline explicite `noiseLayers[]` (enabled, type, roughness, persistence, minValue, mask-first-layer) comme contrat structurant.
- On n’a pas non plus d’étape claire de min/max elevation partagée pour la colorisation (au sens XenoverseUp).

### 4) Surface rendering / matériaux
- Notre shader surface fait du **triplanar PBR multi-matériaux** (rock/sediment/snow/lava/wetness textures procédurales), mélange avec masques terrain et variations par famille.
- C’est qualitativement riche, mais ce n’est pas la logique XenoverseUp (qui repose surtout sur gradient altitude/profondeur piloté par min/max + material physique simple).

### 5) Lighting / couches
- On a un setup d’éclairage plus complexe (ambient + key + fill + bloom, tone mapping ACES, couches ocean/clouds/atmosphere/rings animées).
- XenoverseUp a un modèle beaucoup plus simple pour la planète “core”, et une atmosphère additive basique.
- Notre rendu final est donc piloté par une superposition de couches artistiques et effets post-process maison.

### 6) Héritage d’architecture non-Xenoverse
- Pipeline fortement couplé à `PlanetVisualDNA`, familles, classes de roughness/relief/atmosphère, palettes et contrats canoniques internes.
- Dépendance importante à une logique de rendu “produit” (taxonomy + profils visuels) qui dépasse le noyau procédural de XenoverseUp.

---

## BLOC 2 — Pipeline XenoverseUp
Fonctionnement réel du repo XenoverseUp.

### 1) Architecture générale
- R3F + Three, état via Jotai, paramètres de génération exposés en atoms (`noiseFilters`, gradients, resolution, radius).
- Deux chemins de génération :
  - **CPU** (`planet-cpu/mesh-generation.ts`) : génération directe des sommets par face.
  - **GPU (GPGPU raster compute)** (`planet-gpu/terrain-face.tsx` + `vertex-compute.fs`) : rendu offscreen d’une texture float où RGBA = XYZ + unscaledElevation.
- Le renderer principal utilise `PlanetGPU` et ajoute atmosphère seulement en showcase.

### 2) Organisation CPU/GPU
- Noyau commun de logique = empilement de noise filters (simple/ridgid) avec paramètres standardisés.
- En GPU, la compute pass calcule point cube->sphere + élévation dans shader, puis lit le render target côté CPU pour construire `BufferGeometry`.
- En CPU, même philosophie via `MeshGenerator`.

### 3) Terrain / noise layers
- Contrat clé = `NoiseFilter[]` avec propriétés structurantes :
  `enabled`, `strength`, `roughness`, `center`, `baseRoughness`, `persistence`, `minValue`, `layerCount`, `useFirstLayerAsMask`, `filterType`.
- Le premier layer peut servir de masque pour les suivants (`useFirstLayerAsMask`), ce qui est un marqueur central de la logique XenoverseUp.
- `calculateUnscaledElevation` additionne les layers, avec clamp partiel après première couche.

### 4) Cube-sphere / face workflow
- 6 directions (up/down/left/right/front/back), calcul `axisA/axisB`, grille par face, projection sphère.
- C’est le cœur géométrique du pipeline.

### 5) Min/Max elevation handling
- Min/Max de l’élévation non-scalée mesurés pendant la génération (CPU/GPU), stockés via atoms globaux.
- Shading utilise ce min/max pour normaliser hauteur/profondeur et choisir la couleur (gradient altitude + gradient eau).

### 6) Coloration / shading / materials
- Shader planète basé sur gradient stops :
  - Au-dessus du niveau mer (elevation > 1.0 + mixRange) => gradient terrain.
  - Sous le niveau mer => gradient profondeur.
  - Zone de transition littorale blendée.
- Material `MeshPhysicalMaterial` custom shader : roughness/metalness ajustés simplement selon zone (eau/terre).

### 7) Atmosphère / layers
- Atmosphère additive back-side simple (intensité basée sur dot normal/vue), pas de multi-couches complexes.
- Lumière : ambient + directional minimalistes.

### 8) Essentiel vs secondaire
- **Essentiel** : noise layer stack, cube-sphere face pipeline, min/max normalization, gradient-based shading.
- **Secondaire** : UI éditeur, export, capture polaroid, showcase features.

---

## BLOC 3 — Comparaison directe
Différences bloc par bloc.

### 1. Géométrie
- **Équivalent**: cube-sphere face-based déjà présent chez nous.
- **Écart**: pilotage résolution/LOD et transport des attributs trop spécifiques à notre stack.
- **Manque**: contrat explicite “face generator + elevation-first payload” au lieu de “multi-masks d’abord”.

### 2. Relief / noise / terrain layers
- **Équivalent**: nous avons fbm/ridged + seeds + déterminisme.
- **Non aligné**: absence de hiérarchie officielle `NoiseFilter[]` à paramètres XenoverseUp.
- **Manque critique**: logique first-layer-mask configurable et observable dans un pipeline unique.
- **À refondre**: terrain-fields orienté familles doit devenir un adaptateur par-dessus une base noise-layer XenoverseUp (et non l’inverse).

### 3. Pipeline data -> geometry -> render
- **XenoverseUp**: élévation (et min/max) est la donnée reine.
- **Nous**: pipeline multi-champs riche (water/slope/humidity/temp/thermal/rock/sediment/snow/lava).
- **Écart**: trop de transport de données maison, pas assez de standardisation sur l’élévation non-scalée.
- **Action**: introduire un payload terrain minimal canonique “xeno-compatible”, puis dériver les champs secondaires en post-traitement si besoin produit.

### 4. Surface rendering / materials
- **Nous**: triplanar PBR texturé multi-mask, variations famille.
- **XenoverseUp**: gradient altitude/profondeur + mix littoral + physique simple.
- **Écart**: notre shader principal diverge fortement du modèle de coloration XenoverseUp.
- **Action**: remplacer le shader cœur Planet View par un shader elevation-gradient centré min/max.

### 5. Lighting / visual output
- **Nous**: bloom + 2 directionals + ambient + couches avancées.
- **XenoverseUp**: lighting sobre.
- **Écart**: look final plus cinématique/chargé chez nous, donc visuellement éloigné.
- **Action**: profil “Xenoverse mode” avec lighting simplifié et couches opt-in.

### 6. Runtime / architecture
- **Pollution actuelle**: couplage fort taxonomy/canonical contract -> renderer -> terrain generation.
- **Écart structurel**: le noyau procédural n’est pas isolé de la logique produit.
- **Action**: extraire un `planet-core-xeno` indépendant (noise layers + terrain mesh + minmax + shader core), brancher taxonomy ensuite comme adaptation facultative.

---

## BLOC 4 — Verdict
Sommes-nous réellement alignés ou non ?

**Verdict franc : partiellement, mais encore loin d’un alignement réel XenoverseUp sur le moteur Planet View.**

- Oui sur la famille géométrique cube-sphere.
- Non sur le cœur terrain/noise-layers, le transport de données d’élévation, et le shading principal.
- Non sur la simplicité/hiérarchie de pipeline attendue par XenoverseUp.

---

## BLOC 5 — Écarts à combler
Critiques / importants / secondaires.

### A. Écarts critiques
1. **Absence de noise layer stack XenoverseUp-native** comme contrat central de génération.  
2. **Absence de min/max elevation pipeline** utilisé explicitement pour la colorisation.  
3. **Shader surface principal non aligné** (triplanar multi-mask vs gradient altitude/profondeur).  
4. **Couplage trop fort avec taxonomy/familles** au niveau du cœur terrain.

### B. Écarts importants
1. Séparer clairement le noyau terrain (xeno) des couches produit (taxonomy, styles, canon).
2. Unifier la logique CPU/GPU (même contrat d’entrée noise layers).
3. Simplifier le lighting par défaut Planet View pour éviter l’écart visuel structurel.
4. Rendre océans/nuages/anneaux/atmosphère des modules additionnels autour d’un core aligné.

### C. Écarts secondaires
1. UI de debug/inspection des layers et min/max.
2. Parité fine de paramètres artistiques (gradients, transitions littorales).
3. Optimisations perf (compute GPU plus agressif, export, snapshots).

---

## BLOC 6 — Plan d’implémentation
Comment intégrer réellement la logique XenoverseUp dans notre code.

### 1) Ce qu’on garde
- Déterminisme seed / contrat canonique global produit.
- Cube-sphere par faces (déjà bon socle).
- Couches additionnelles (clouds/atmosphere/rings) mais **après** alignement du core.

### 2) Ce qu’on remplace
1. `terrain-fields.ts` -> remplacer par un **TerrainCoreXeno**:
   - entrée: `noiseLayers[]` (simple/ridgid, params XenoverseUp), `seed`, `radius`, `resolution`
   - sortie: `unscaledElevation`, `scaledElevation`, `pointOnSphere`, `minMax`
2. `surface-shader-assembly.ts` -> nouveau shader core:
   - gradient terrain + gradient profondeur
   - mix littoral
   - roughness/metalness sobres
   - normalisation via `uMinMax`
3. `create-planet-render-instance.ts` -> pipeline centré sur payload élévation + min/max.

### 3) Ce qu’on supprime
- Les règles terrain qui injectent directement des biais famille dans le cœur géométrie/élévation.
- Les morceaux de shader dépendants de nombreux masks non essentiels au core Xenoverse.
- Toute logique d’assemblage “hybride multi-références” dans Planet View.

### 4) Ordre de convergence (strict)
1. **Étape 1 — Core terrain XenoverseUp-compatible** (sans changer les couches visuelles externes).
2. **Étape 2 — Shader surface XenoverseUp-compatible** (gradient + min/max).
3. **Étape 3 — Adaptation taxonomy** en surcouche (mapping paramètres, pas de fork pipeline).
4. **Étape 4 — Simplification lighting par défaut** + profil opt-in “cinematic”.
5. **Étape 5 — Nettoyage legacy** (retirer anciens branchements hybrides).

### 5) Priorités de refonte code
- Priorité P0: `terrain-fields.ts`, `build-displaced-sphere.ts`, `surface-shader-assembly.ts`.
- Priorité P1: contrat `types.ts` pour exposer min/max et noiseLayers.
- Priorité P2: intégration UI/debug et optimisation compute.

### 6) Garde-fous anti-mélange (obligatoires)
- Définir un ADR “Planet View = XenoverseUp Core Only”.
- Interdire toute nouvelle logique terrain hors `TerrainCoreXeno` (lint/architecture rule).
- Toute contrainte produit (taxonomy, canon) doit passer par mapping d’entrée/sortie, jamais par modification du noyau.
- Ajouter tests d’architecture qui échouent si un module non-core recalcule l’élévation.

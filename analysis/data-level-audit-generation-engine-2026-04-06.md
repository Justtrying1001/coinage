# Audit technique — niveau de données produit par le moteur de génération (2026-04-06)

## Périmètre et méthode
- Source de vérité inspectée: code runtime uniquement (pipeline génération → mapping uniforms → géométrie/attributs → shader → Planet View/Galaxy View).
- Référence visuelle cible: non disponible dans ce dépôt au moment de l’audit (constat).
- Conclusion synthétique: le pipeline génère plusieurs signaux utiles mais reste **partiellement structuré** et perd trop d’information intermédiaire pour un rendu “petit monde cohérent”.

## 1) Inventaire des données réellement produites

### 1.A Données de base (seed / identité / profil)
- `worldSeed`, `planetSeed` (string), puis sous-seeds dérivés `baseSeed`, `shapeSeed`, `reliefSeed`, `colorSeed`, `atmoSeed`, `hydroSeed` (entiers). Continues/discrètes mixtes.
- Génération d’`identity`: archetype + familles (shape/relief/hydrology/surface/palette/atmosphere), ratios cibles terre/océan, effets autorisés/interdits, contraintes visuelles, tuning de rendu.
- Génération d’un `PlanetVisualProfile`: hydrologie, shape, relief, color, atmosphere.
- Limite: ces données restent majoritairement des **paramètres de génération**, pas des champs géographiques persistants spatialisés.

### 1.B Données géographiques source
- Pas de “continent field” persistant en sortie moteur. Le “continent signal” est calculé localement dans `computeElevation` (macro noises + seuil/sharpness) puis consommé immédiatement.
- Données géo dérivées localement au vertex: `shorelineProximity`, `inlandMask`, `continentalGradient`, `coastNoise`, `trenchSignal`, etc. (continu), mais non exportées comme cartes globales.
- Hydrologie globale: résolution par quantiles (`resolveTerrainHydrology`) pour ajuster `effectiveOceanLevel` et respecter un ratio terre minimum.
- Limite: absence de stockage explicite de distances robustes (coast distance, inland depth, ocean depth), shelf map, réseau hydro.

### 1.C Données de relief
- Relief brut calculé par combinaison multi-bruits: macro/méso/micro (`fbm`, `ridgedFbm`) + masques (mountain/crater/trench/etc.).
- `rawElevation` -> normalisation locale -> lissage -> cap amplitude (`elevationCap`) -> elevation finale.
- Slope géométrique calculée après génération (`slopeByVertex`) via gradient voisinage face cube.
- Limite: pas de stockage de courbure, ruggedness multi-échelle, bassin/ridge field exportables; pas de hiérarchie terrain persistée au-delà des attributs packés.

### 1.D Données de classification terrain
- Classification implicite par bandes continues (`deepOceanBand`, `shelfWaterBand`, `shorelineBand`, `lowPlainsBand`, `midPlainsBand`, `highlandBand`, `mountainBand`, `iceCap`).
- Certains masques servent couleur + packing attributs.
- Limite: pas de classes explicites persistées par cellule/région (ex: region ids, biome ids, plateau masks stables).

### 1.E Données de rendu
- `color` vertex RGB (3 canaux).
- `terrain` vertex RGBA packé (4 canaux): altitude normalisée, signal côte/shoreline, signal fertile/flatland-like, signal pente/rugged.
- Material/shader: MeshStandardMaterial + `onBeforeCompile` consommant uniquement ces 4 canaux + quelques uniforms globaux (`uPlanetDetailIntensity`, `uPlanetContrast`, `uThermalActivity`).
- Atmosphère: paramètres globaux simples (color/intensity/thickness/light direction).
- Limite: forte compression d’information en 4 floats vertex; aucun multi-canal matériau “physique” robuste (roughness/ao/curvature/wetness séparés).

## 2) Cartographie des flux de données

1. `worldSeed + planetSeed` -> `PlanetVisualProfile` (identité + paramètres)  
2. `PlanetVisualProfile` -> `ProceduralPlanetUniforms` (mapping heuristique + clamps + garde-fous ratios)  
3. `ProceduralPlanetUniforms` -> génération terrain (worker/main thread): positions + colors + terrain packed  
4. Buffers -> `BufferGeometry` (`position`, `color`, `terrain`)  
5. `terrain` packed -> shader enhancement surface (normal perturb, roughness et tint heuristiques)  
6. Planet View/Galaxy View affichent même base data, LOD ajuste surtout résolution/forces

Points de perte/compression:
- Perte #1: champs intermédiaires riches de `computeElevation` non conservés (continentSigned, inlandMask, shorelineProximity, ridge/crater/trench…).
- Perte #2: classification compressée en 4 canaux `terrain`.
- Perte #3: shader dépend d’indices composites, pas de champs physiques indépendants.
- Perte #4: LOD ne crée pas de nouvelles données de proximité, seulement résolution + atténuation.

## 3) Diagnostic demandé (oui/non/partiellement)

1. Continents crédibles: **partiellement**.
   - Il existe un signal macro-continental et des paramètres de drift/sharpness, mais pas de continent field persistant ni régionalisation tectonique stable exportée.

2. Côtes crédibles: **partiellement**.
   - Plusieurs signaux de côte sont générés, mais pas de vraie distance côtière robuste ni shelf/bathymétrie structurée persistée.

3. Relief crédible: **partiellement**.
   - Relief multi-couches présent, slope présente; mais manque de champs structurés (curvature, ridge/basin maps exportées) et de cohérence régionale exploitable au rendu.

4. Hiérarchie de surface: **non** (au niveau requis “haut”).
   - Hiérarchie implicite locale existe, mais pas de hiérarchie persistée multi-échelle (macro régions -> sous-régions -> micro contextes).

5. Texture/matière riche: **non**.
   - Shader alimenté par data compacte (vertex color + terrain vec4), sans banque de signaux matériaux dédiée.

6. Planet View nettement supérieure: **partiellement**.
   - LOD “planet” améliore résolution et détail, mais sans nouveaux champs proche-sol contextuels.

7. Dépendance data compacte / vertex-only / classée tôt: **oui**.
   - C’est un verrou majeur observé dans la chaîne actuelle.

## 4) Écart technique avec un rendu de référence “riche”

### 4.A Données géographiques manquantes
- Coast distance signed robuste (terre/mer), inlandness, ocean depth persistants.
- Region masks stables (continents, bassins, plateaux, chaînes).
- Ridge/basin fields exportés pour un relief narratif et gameplay local.
- Flatland/constructibility signal explicite et stable.

### 4.B Données matériau manquantes
- Curvature (convexe/concave), AO géométrique approximée, wetness/aridity contextuelle.
- Drivers roughness séparés (pente, lithologie, humidité, érosion), au lieu d’un mélange unique.
- Masques locaux multi-canaux (sol nu, dépôt, roche affleurante, glace, altération).

### 4.C Données Planet View close-up manquantes
- Signaux multi-échelle dédiés proximité (macro -> méso -> micro contextuels).
- Synthesis détaillée conditionnée par contexte (coast, valley, plateau, slope class).
- Champs de variation locale persistants (pas uniquement bruit shader en vue).

## 5) Verdict

### Question centrale
**Le moteur produit-il assez de données structurées pour un rendu haut niveau ?**  
→ **Partiellement**.

### Verdict “moteur trop pauvre en data pour la cible ?”
→ **Oui** (au regard du niveau visuel cible mentionné).

### Donnée manquante la plus critique (priorité unique)
→ **Un champ continu de distance côtière/inlandness (signed coast distance field) persistant et propagé jusqu’au shader**.

Raison: il structure simultanément continents/côtes/matière/variation locale et permet d’orchestrer relief + matériaux + gameplay local avec cohérence.

## 6) Plan de correction (orienté data)

### A. Fondamentales (indispensables)
1. **Signed coast distance field + inlandness + ocean depth**
   - Calcul: post-normalisation elevation/hydrologie.
   - Stockage: texture/champ par patch LOD + échantillonnage shader.
   - Exploitation: côtes, shelves, humidité, transitions matériau.

2. **Region graph hiérarchique** (continents/bassins/chaînes/plateaux)
   - Calcul: segmentation sur signaux macro + ridge/basin.
   - Stockage: ids + masques régionaux.
   - Exploitation: cohérence visuelle et gameplay local.

3. **Relief fields exportés** (ridge strength, basin likelihood, curvature)
   - Calcul: dérivés de heightfield multi-échelle.
   - Stockage: canaux dédiés (pas seulement vec4 terrain).
   - Exploitation: shading, matériaux, navigation.

### B. Importantes (fort levier qualité)
1. **Material drivers contextuels** (slope x curvature x humidity x altitude)
   - Produits côté génération; consommés côté shader PBR.
2. **Flatland/constructibility explicite**
   - Signal stable gameplay/rendu local.
3. **Erosion-like masks**
   - Dépôts, ravinement, rupture littorale simulés rapidement.

### C. Finition (après base)
1. Detail synthesis proche-sol contextuelle.
2. Micro-variation matériau dépendante des masques structurants.
3. Ajustements atmosphère/lumière dépendants des régions et altitude.

## 7) Réponse finale compacte
- Moteur suffisamment structuré pour la cible haut niveau: **partiellement**.
- Moteur actuellement trop pauvre en data pour la cible: **oui**.
- Priorité #1: **signed coast distance/inlandness persistant**.

# Planet Engine

## 1. Vue d’ensemble

Le moteur planète de Coinage construit une planète **déterministe** à partir d’un couple `worldSeed` + `planetSeed`, puis la rend en Three.js via un pipeline séparé en deux phases :

1. **Génération canonique** (domaine) : identité, classification, ADN visuel, paramètres de rendu.
2. **Rendu** (rendering) : création des meshes, matériaux shader, couches visuelles et animation.

Le déterminisme repose sur `deriveSeed(...)` et un RNG seedé (`createSeededRng`), ce qui garantit qu’une même seed reproduit la même planète (famille, palette, relief, tailles, noise seeds, anneaux, etc.).

## 2. Pipeline de génération

### Entrée seed

`PlanetSeedInput` contient :
- `worldSeed`
- `planetSeed`
- `planetId` optionnel
- `worldPosition` optionnelle

Une seed canonique est calculée :
- `canonicalSeed = deriveSeed("${worldSeed}::${planetSeed}", "planet-canonical-v2")`

### Sélection de `FamilyRecipe`

Le moteur choisit une recette via pondération (`weightedRecipe`) parmi des familles :
- terrestres (`terrestrial-lush`, `oceanic`, `desert-arid`, `ice-frozen`, `volcanic-infernal`, `barren-rocky`, `toxic-alien`)
- géantes gazeuses (`gas-giant`, `ringed-giant`)

La recette définit :
- classes (surface, relief, roughness, atmosphère)
- plages de génération (ocean coverage, cloud coverage, relief, roughness, specular, emissive, banding)
- palettes de couleurs
- possibilité d’anneaux

### `PlanetClassification`

Construit à partir de la recette :
- `surfaceModel`
- `atmosphereClass`
- `roughnessClass`
- `reliefClass`
- `hasOceans`
- `canHaveClouds`
- `canHaveRings` (forcé pour `ringed-giant`, sinon probabiliste/lié au modèle)

### `PlanetVisualDNA`

L’ADN visuel contient notamment :
- palette et couleurs : `colorDeep`, `colorMid`, `colorHigh`, `oceanColor`, `accentColor`, `cloudColor`, `atmosphereTint`
- paramètres de matière : `reliefAmplitude`, `roughness`, `specularStrength`, `emissiveIntensity`, `bandingStrength`
- couvertures : `oceanCoverage`, `cloudCoverage`
- densité : `atmosphereDensity`
- seeds de bruit : `surface`, `moisture`, `thermal`, `clouds`, `bands`, `rings`
- rotation : vitesses surface/clouds + `axialTilt`

Génération des éléments demandés :
- **Couleurs** : choix palette de famille + jitter contrôlé (`jitterColor`) pour variation locale.
- **Relief** : amplitude stockée dans DNA, ensuite appliquée au mesh lors de la displacement.
- **Ocean coverage** : tirée dans la plage de la recette si la planète a des océans.
- **Atmosphere** : teinte + densité calculées même si la couche atmosphère n’est pas activée au rendu actuel.
- **Rings** : activés via classification, puis paramètres géométriques/opacité générés dans `generated.ring`.

## 3. Terrain / Noise

Le sampler terrain (`sampleTerrain`) bifurque selon `surfaceModel` :

- **Solide/frozen/volatile** : `sampleSolid`
- **Gazeux** : `sampleGaseous`

Types de bruit utilisés :
- bruit de base 3D interpolé (`noise3`)
- **fBm** (`fbm`) pour grands champs continus (continents, humidité, température, turbulence)
- **ridged** pour chaînes montagneuses
- `craterField` pour impact/cratères

Le sampler produit les masques/champs suivants :
- `height01`
- `continentMask`
- `humidityMask`
- `temperatureMask`
- `erosionMask`
- `craterMask`
- `bandMask` (utilisé pour géantes gazeuses)
- plus : `mountainMask`, `landMask`, `coastMask`, `oceanDepth`, `thermalMask`

Rôle des masques et usage shader :
- `height01` + `mountainMask` : structure relief/couleurs de relief.
- `continentMask`, `landMask`, `coastMask`, `oceanDepth` : séparation mer/terre/côtes + transitions.
- `humidityMask`, `temperatureMask` : variation biome/tint de surface.
- `erosionMask`, `craterMask`, `thermalMask` : modulation fine du relief et des zones actives.
- `bandMask` : bandes des géantes gazeuses.

Ces valeurs sont copiées en attributs vertex (`aHeight`, `aContinentMask`, etc.) et lues dans les shaders surface.

## 4. Render Pipeline

Le rendu s’appuie sur :
- `PlanetRenderProfile` (profil consolidé issu de la génération)
- `createPlanetRenderInstance(...)` (assemblage Three.js)

### Détails du pipeline

1. Création d’un `PlanetViewProfile` (mode `galaxy` vs `planet`) avec LOD, segments, contrastes.
2. Génération mesh principal via `buildDisplacedSphereGeometry` (sphère déplacée + attributs terrain).
3. Création matériau shader surface :
   - `SURFACE_FRAGMENT_SHADER_GALAXY` (vue galaxie)
   - `SURFACE_FRAGMENT_SHADER_PLANET` (vue planète)
4. Couches optionnelles :
   - **surface** : active
   - **ocean** : code présent mais couche actuellement inactive (`enableOceanLayer: false`)
   - **rings** : actives selon profil

### Clouds et atmosphere

Les structures clouds/atmosphere sont générées dans les profils, mais au niveau rendu actuel :
- `enableClouds: false`
- `enableAtmosphere: false`

Donc ces couches ne sont pas instanciées visuellement dans `createPlanetRenderInstance`.

## 5. Galaxy vs Planet rendering

### Galaxy view
- LOD bas (`lod: low`)
- moins de segments mesh
- shader surface simplifié (`SURFACE_FRAGMENT_SHADER_GALAXY`)
- objectif : lisibilité + performance sur vue globale

### Planet view
- LOD haut (`lod: high`)
- plus de segments mesh
- shader surface enrichi (`SURFACE_FRAGMENT_SHADER_PLANET`)
- objectif : plus de détails de matériaux et de biomes

## 6. Logique shader actuelle

La couleur finale surface est calculée à partir d’un albédo combiné :

- `height` (`vHeight`) : influence gradients de relief
- `continent` (`vContinentMask`) : pondère logique continentale
- `humidity` (`vHumidityMask`) : influence teinte biome
- `temperature` (`vTemperatureMask`) : influence chaleur/sécheresse
- `coast` (`vCoastMask`) : transitions littorales
- `mountain` (`vMountainMask`) : accent hautes altitudes

Le modèle de lumière est actuellement stylisé et uniforme :
- pas de cycle jour/nuit ni source stellaire physique dédiée dans ce shader
- modulation simple par hémisphère (`normal.y`) + `lightingBoost` + `shadingContrast`

## 7. Performance design

La séparation Galaxy/Planet sert à contrôler le coût :
- vue galaxie : shader simple + géométrie plus légère
- vue planète : shader plus riche + plus de segments

Ce qui est explicitement désactivé pour performance/stabilité actuelle :
- clouds
- atmosphere
- ocean layer (même si implémentée)
- couches supplémentaires non essentielles

Stratégie actuelle : privilégier une base stable déterministe, puis enrichir progressivement les couches visuelles.

## 8. Limitations actuelles

Limites observables dans le code actuel :
- formes de continents encore perfectibles (noise procédural simple sans simulation géologique poussée)
- palettes encore génériques par famille
- rendu global en itération (pipeline présent mais volontairement contraint)
- shader volontairement stylisé/simple (pas de modèle physique jour/nuit complet)

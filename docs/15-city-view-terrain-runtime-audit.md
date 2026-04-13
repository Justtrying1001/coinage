# City View Terrain Rebuild Spec (runtime-grounded)

Date: 2026-04-13  
Scope: plan de reconstruction du pipeline terrain `city3d` basé sur l'audit runtime déjà acté.

---

## 1. Executive summary

La City View actuelle atteint le niveau « prototype » mais pas « city-builder premium » parce que le pipeline terrain ne sépare pas les couches critiques (macro-forme, micro-relief, masks biome, matériaux, ambiance). Le rebuild doit conserver le bon socle (mode system, seed determinism, génération CPU initiale) et remplacer les zones limitantes (macro-forme simplifiée, vertex-color shading, décor abstrait, compo visuelle pauvre).

Décision directrice:
1. Refaire d'abord la macro-forme terrain (lisibilité city-builder).
2. Refaire ensuite le shading matière et les biome masks.
3. Rebrancher l'eau/glace/lave comme couche dédiée.
4. Refaire le set dressing biomique.
5. Finaliser caméra/lumière/atmosphère.
6. Verrouiller une grille cachée build-ready.

---

## 2. What is wrong today

### 2.1 Géométrie
- Relief appliqué sur un `PlaneGeometry` unique via formule CPU locale.
- Macro-forme pilotée par noise + plateau central + edge-drop radial.
- Résultat: silhouette globale peu crédible (pas de lecture de bassins/chaînes/plateaux structurants).

### 2.2 Shading
- Matériau terrain en `MeshStandardMaterial` + `vertexColors`.
- Pas de vraie matière au sol (pas de normal map/roughness map/height blend par couches).
- Le relief perçu vient surtout de la lumière globale, pas de la matière.

### 2.3 Composition
- Caméra fixe + fog basique + fond couleur uniforme.
- Far field = grand plane teinté, sans horizon crédible.
- Sensation de « terrain posé dans le vide ».

### 2.4 Biomes
- Les biomes changent palette et quelques scalaires de relief.
- Différenciation géomorphologique insuffisante entre plusieurs biomes.
- Signature visuelle non immédiate pour certains biomes (surtout hors oceanic/frozen/volcanic).

### 2.5 Décor
- Instancing performant, mais primitives trop abstraites.
- Distribution surtout annulaire/périphérique, peu de narration spatiale.
- Les props ne structurent pas l'espace de gameplay.

---

## 3. Target terrain architecture

Architecture cible en 8 couches, obligatoirement séparées:

1. **Macro-shape terrain**
   - Génère la silhouette globale: plateau jouable central, bassins, escarpements, périphérie.
   - Doit être biome-aware et seed-deterministic.

2. **Micro-relief**
   - Détails de surface (rides, stries, petits accidents), décorrélés de la macro-forme.
   - Intensité modulée par pente + biome + distance caméra.

3. **Biome masks**
   - Masques continus (0..1) pour matière et décor: lowland/highland/cliff/wet/frozen/volcanic/mineralized.
   - Déduits de hauteur + pente + humidité/thermique dérivées du profil biome.

4. **Sol / matériaux / blend**
   - Matériau multi-couches: base + cliff + dépôt + accent biome.
   - Blend piloté par masks (hauteur, pente, exposition, humidité locale).

5. **Eau / glace / lave**
   - Couche dédiée indépendante du terrain principal.
   - Shoreline/transition traitée par masque de rivage et non simple plan uniforme.

6. **Set dressing biomique**
   - Biome kits (props cohérents), distribution par zones, densité hiérarchisée.
   - Préserver instancing mais avec familles de meshes par biome.

7. **Caméra / lighting / atmosphere**
   - Cadrage gameplay-first, horizon lisible, profondeur atmosphérique.
   - Lighting cohérent avec les matériaux.

8. **Grille cachée build mode**
   - Surface jouable stable, pentes contrôlées dans le cœur buildable.
   - Couche de validation topologique séparée du rendu.

---

## 4. Terrain rebuild pipeline

### 4.1 Géométrie terrain

**Base mesh cible**
- Conserver le concept de 2 niveaux: `terrainNear` + `farField`.
- Near: garder une densité élevée (ordre de grandeur actuel OK), mais pilotée par LOD local à terme.
- Far: simplifié, moins détaillé, orienté silhouette/horizon.

**Macro-forme cible**
- Construire la hauteur via 4 blocs explicites:
  1) `buildableCoreShape` (plateau jouable propre)
  2) `transitionBand` (pentes/terrasses)
  3) `biomeLandforms` (bassins, failles, dunes, moraines, etc.)
  4) `perimeterDrop` (bordure contrôlée)
- Supprimer la logique monolithique actuelle où tout est mélangé dans une seule équation.

**Falaises / shelf / bassins / plateaux**
- Falaises: dérivées de gradient cible + seuil de pente.
- Shelf littoral (oceanic/frozen): généré explicitement par distance au rivage.
- Bassins: macro-signatures par biome (pas uniquement du bruit).
- Plateaux: surfaces quantifiées légères uniquement dans la zone buildable, pas globalement.

### 4.2 Génération de hauteur

**À garder**
- Seed determinism.
- Helpers noise CPU existants comme fallback/prototypage.
- Notion de `buildableWeight` liée à la grille.

**À remplacer**
- Équation unique `sampleTerrainHeight` actuelle.
- Mélange direct « noise + rim drop » sans étapes nommées.

**Couches de relief à séparer**
1. `macroBase`
2. `biomeShape`
3. `coreFlatten`
4. `edgePolicy`
5. `microDetail`

Chaque couche expose des paramètres explicites versionnables.

### 4.3 Shading sol

**Matériau cible**
- Étape 1 (safe): `MeshStandardMaterial` enrichi via `onBeforeCompile` pour blend multi-couches.
- Étape 2 (si nécessaire): `ShaderMaterial` dédié terrain pour contrôle total.

**Maps attendues**
- Par couche: albedo + normal + roughness (+ AO si disponible).
- Optionnel: height detail map pour parallax léger (pas displacement lourd au début).

**Blend attendu**
- Masques combinés: hauteur normalisée, pente, courbure approximée, humidité locale, biome weights.
- Cliff automatique par pente forte.
- Dépôts/sédiments en zones basses et faibles pentes.

### 4.4 Biomes

Objectif strict: un biome doit modifier **forme + matière + périphérie + décor**, pas seulement couleur.

Implémenter un `BiomeTerrainSpec` par biome avec:
- macro parameters
- material set
- water/ice/lava policy
- decor policy
- atmosphere hints

### 4.5 Décor

Remplacer primitives abstraites par kits de props biomiques:
- Forest/Jungle: arbres multi-espèces, sous-couche, rochers humides.
- Arid/Barren: roches stratifiées, dunes props, débris secs.
- Frozen: blocs de glace, plaques fissurées, roches givrées.
- Volcanic: scories, colonnes basaltiques, fractures chaudes.
- Mineral: veines/cristaux + outcrops minéraux.
- Oceanic: rochers côtiers, végétation littorale.

Distribution:
- Masques d'écologie par biome (densité, exclusion build core, distances au rivage/faille).
- 3 échelles: landmarks rares, props moyens, micro clutter.

### 4.6 Ambiance

- Horizon dédié (ring mesh, backdrop ou sky gradient physique simple).
- Fog non uniforme (densité/teinte corrélée biome + distance).
- Réglage exposition et key/fill calibré par biome family.
- Fond jamais « flat color pur » en final.

---

## 5. Biome-by-biome target spec

> Priorité stricte: **oceanic** puis **frozen**.

### 5.1 Oceanic (priorité 1)
1. **Macro-forme**: île/archipel central buildable, shelf côtier lisible, lagunes secondaires.
2. **Matière sol**: terre humide + sable + roche côtière, transitions nettes rivage/haut.
3. **Périphérie**: chute vers eau profonde avec gradation shelf -> drop.
4. **Décor**: végétation littorale, rochers côtiers, bois flotté/éléments humides.
5. **Signature visuelle**: lecture immédiate « monde côtier vivant ».

### 5.2 Frozen (priorité 2)
1. **Macro-forme**: plateau glacé central, fractures et champs de pression en couronne.
2. **Matière sol**: neige compactée, glace bleue, roche froide exposée sur pentes.
3. **Périphérie**: banquise/shelf gelé puis cassure.
4. **Décor**: aiguilles de glace, dalles fissurées, roches givrées.
5. **Signature visuelle**: lecture immédiate « croûte gelée fracturée ».

### 5.3 Arid
1. **Macro-forme**: plateaux secs + dunes basses + cuvettes érodées.
2. **Matière sol**: sable, terre dure, roche ocre.
3. **Périphérie**: escarpements secs progressifs.
4. **Décor**: roches sculptées, buissons rares, débris minéraux.
5. **Signature visuelle**: désert stratifié venté.

### 5.4 Volcanic
1. **Macro-forme**: dômes/ruptures, couloirs de lave fossile, relief cassé.
2. **Matière sol**: basalte sombre, cendres, zones incandescentes localisées.
3. **Périphérie**: fractures profondes et anneaux effondrés.
4. **Décor**: scories, colonnes, évents.
5. **Signature visuelle**: terrain chaud, sombre, instable.

### 5.5 Mineral
1. **Macro-forme**: crêtes métalliques, veines affleurantes, buttes anguleuses.
2. **Matière sol**: roche minérale froide + inclusions brillantes discrètes.
3. **Périphérie**: pentes cassantes, champs d'éboulis.
4. **Décor**: clusters cristallins, outcrops géométriques.
5. **Signature visuelle**: monde riche en gisements.

### 5.6 Terrestrial
1. **Macro-forme**: collines douces, vallons, plateaux fertiles.
2. **Matière sol**: terre végétalisée, roche douce, zones humides modérées.
3. **Périphérie**: transition naturelle vers relief plus abrupt.
4. **Décor**: arbres mixtes, buissons, rochers moussus.
5. **Signature visuelle**: planète tempérée habitable.

### 5.7 Jungle
1. **Macro-forme**: relief humide, ravines peu profondes, dômes végétalisés.
2. **Matière sol**: sol sombre humide, mousse, roche couverte.
3. **Périphérie**: transitions denses vers lisières marécageuses.
4. **Décor**: canopée dense, troncs, racines, roches humides.
5. **Signature visuelle**: densité organique immédiate.

### 5.8 Barren
1. **Macro-forme**: plaines érodées, buttes nues, impacts anciens adoucis.
2. **Matière sol**: poussière rocheuse, graviers, croûte sèche.
3. **Périphérie**: retombée stérile sans eau.
4. **Décor**: roches dispersées, structures minérales mortes.
5. **Signature visuelle**: monde aride mort, faible biodiversité.

---

## 6. Ordered rebuild plan

Ordre strict recommandé pour CE repo:

1. **Refonte macro-forme terrain**
   - Extraire pipeline height en couches nommées.
   - Stabiliser le cœur buildable.

2. **Refonte biome masks**
   - Introduire système de masques unifiés (hauteur/pente/humidité/biome).

3. **Refonte shading matière**
   - Introduire blend multi-couches terrain sur base standard (puis shader dédié si nécessaire).

4. **Refonte eau/glace/lave**
   - Couche fluide/gel/magma avec rivages et transitions cohérentes.

5. **Refonte décor biomique**
   - Props réels, règles de placement multi-échelle, conservation instancing.

6. **Refonte caméra / lighting / atmosphere**
   - Cadrage final, horizon, fog calibrée, exposition cohérente.

7. **Intégration build-ready**
   - Validation des surfaces constructibles, hooks pour grille cachée et futur build mode.

---

## 7. Keep / Adapt / Replace

### Keep
- `CoinageRenderApp` mode switching.
- Seed determinism `planetProfileFromSeed`.
- Instancing comme stratégie de perf.

### Adapt
- `CityFoundationMode` comme orchestrateur haut niveau.
- Helpers noise existants en utilitaires de couche micro.
- `CityLayoutStore` comme contrainte de buildability.

### Replace
- `sampleTerrainHeight` monolithique.
- `tintTerrain` vertex-color comme rendu final.
- Primitives décor comme identité biome principale.
- Far-field purement teinté sans vrai horizon.

---

## 8. Files to touch

| Path | Rôle actuel | Rôle futur | Action |
|---|---|---|---|
| `src/game/render/modes/CityFoundationMode.ts` | Orchestrateur + génération height + tint + décor + lights | Orchestrateur uniquement (assemblage des sous-systèmes) | **adapt** |
| `src/game/world/galaxyGenerator.ts` | Produit `PlanetVisualProfile` | Exposer/normaliser paramètres utiles au terrain city (si besoin) | **adapt** |
| `src/game/city/layout/cityLayout.ts` | Snapshot grid buildable/blocked | Fournir contraintes pour core flatten et valid build surface | **adapt** |
| `src/styles/globals.css` | Positionnement city HUD/canvas | Ajustements de framing UI overlay selon nouvelle compo | **adapt** |
| `src/game/render/modes/terrain/CityTerrainPipeline.ts` | n/a | Pipeline hauteur en couches (macro/micro/edge/core) | **create** |
| `src/game/render/modes/terrain/CityTerrainTypes.ts` | n/a | Types de specs terrain/biome/masks | **create** |
| `src/game/render/modes/terrain/CityBiomeSpecs.ts` | n/a | Spécifications biome-by-biome (forme/matière/eau/décor/atmo) | **create** |
| `src/game/render/modes/terrain/CityTerrainMaterial.ts` | n/a | Matériau terrain blendé (onBeforeCompile puis shader dédié) | **create** |
| `src/game/render/modes/terrain/CityWaterLayer.ts` | n/a | Eau/glace/lave + transitions rivage | **create** |
| `src/game/render/modes/terrain/CityDecorSystem.ts` | n/a | Placement props biomiques multi-échelle | **create** |
| `src/game/render/modes/terrain/CityAtmosphereRig.ts` | n/a | Horizon/fog/sky/light presets | **create** |
| `src/game/render/modes/terrain/CityBuildSurface.ts` | n/a | Validation et extraction surface build-ready | **create** |

---

## 9. Risks / caveats

### 9.1 Perf
- Risque: shaders multi-couches + props plus nombreux.
- Mitigation: instancing conservé, budget texture par biome, qualité scalable.

### 9.2 Complexité shader
- Risque: explosion de branches par biome.
- Mitigation: shader générique + `BiomeTerrainSpec` data-driven, pas de fork shader par biome.

### 9.3 Dette technique
- Risque: laisser trop de logique dans `CityFoundationMode`.
- Mitigation: extraction modulaire immédiate en pipeline/services.

### 9.4 Couplage biomes planétaires
- Risque: dépendance fragile entre profil planète global et besoin city local.
- Mitigation: contrat clair `PlanetVisualProfile -> CityBiomeInput` avec mapping stable.

### 9.5 Grille cachée / build mode
- Risque: beau terrain mais non constructible.
- Mitigation: définir tôt la règle « buildability first » dans macro-shape + validation de pente/planéité.

---

## Definition of done (rebuild terrain city)

Le rebuild terrain est validé si:
1. Chaque biome est identifiable en <1 seconde sans HUD.
2. Le cœur buildable est lisible et exploitable.
3. Le sol présente une matière crédible (pas seulement une teinte).
4. Le cadre visuel n'évoque plus une démo technique.
5. Le pipeline reste seed-deterministic et maintenable.

# Planet View Refactor Plan

## 1. Executive summary

Le rendu Planet View actuel plafonne pour une raison simple: la donnée procédurale est déjà solide, mais la chaîne de rendu qui l’exploite est sous-structurée (shader monolithique, couches visuelles inactives, lighting stylisé minimal, relief peu hiérarchisé).  
La référence visuelle est supérieure non pas par “plus de bruit”, mais par une meilleure hiérarchie visuelle: silhouette lisible, séparation des matières, volume perçu, et couches atmosphériques qui donnent de la vie.

La recommandation n’est **pas** un polish. C’est une **refonte profonde ciblée** de la Planet View, en conservant la base canonique (seed/identity/manifest) et en reconstruisant le pipeline rendu en couches modulaires.

Verdict tranché:
- **Type de chantier**: refonte partielle structurelle (render/procédural visuel), pas full rewrite projet.  
- **Ce qu’on garde**: seed déterministe, CanonicalPlanet, manifest 500, terrain masks existants, cohérence galaxy/planet.  
- **Ce qu’on refond**: architecture shader/material, hiérarchie relief géométrique+shading, activation réelle des layers planet (ocean/cloud/atmo), lighting final look, stratégie variété perceptuelle.

Bénéfices visuels attendus (réalistes):
- relief macro/mid/micro beaucoup plus lisible,
- silhouette moins “balle lisse bruitée”,
- séparation sol/eau/roche/glace claire,
- planète plus “vivante” (nuages/atmosphère crédibles),
- montée nette en qualité sans casser la base canonique.

---

## 2. What must be preserved from the current system

### 2.1 Seed system déterministe (`seeded-rng.ts`) — **à conserver strictement**

Pourquoi:
- c’est la garantie de reproductibilité (`deriveSeed`, `createSeededRng`) pour génération et debug.
- indispensable pour QA visuelle, régressions, captures comparatives.

À conserver:
- format de dérivation `base::label`,
- mécanique RNG actuelle,
- labels de seed versionnés (`planet-canonical-v2`) tant qu’on ne fait pas de migration explicite.

### 2.2 Canonical identity & contracts (`planet-visual.types.ts`, `generate-planet-visual-profile.ts`) — **à conserver avec extensions contrôlées**

Pourquoi:
- séparation identity/classification/visualDNA/render profile existe déjà.
- base propre pour faire évoluer le rendu sans casser l’identité planète.

À conserver:
- `PlanetIdentity`, `PlanetClassification`, `CanonicalPlanet`.
- principe: Planet View dérive du canonique, pas l’inverse.

### 2.3 Manifest generation des ~500 planètes (`build-galaxy-planet-manifest.ts`) — **à conserver**

Pourquoi:
- pipeline stable et déjà aligné sur la volumétrie réelle.
- cache utile pour éviter recalcul continu.

À conserver:
- génération canonique en amont,
- mapping id/seed stable,
- cohérence positions/radii avec layout.

### 2.4 Cohérence Galaxy/Planet (`resolve-planet-identity.ts`, tests) — **invariant non négociable**

Pourquoi:
- Planet View doit continuer d’afficher la même planète que Galaxy View.
- base de confiance produit pour navigation et validation.

À conserver:
- résolution via manifeste canonique,
- invariants tests de cohérence inter-vues.

### 2.5 Terrain attributes existants (`build-displaced-sphere.ts`) — **à préserver et enrichir**

Pourquoi:
- les `aHeight`, `aLandMask`, `aMountainMask`, `aHumidityMask`, `aTemperatureMask`, etc. sont déjà une excellente base matériau.

À conserver:
- modèle attributaire actuel,
- logique d’injection dans la géométrie.

### 2.6 Règles déterministes de génération (`generateCanonicalPlanet`, `terrain-noise.ts`) — **à conserver**

Pourquoi:
- la robustesse actuelle vient d’un flux déterministe continu, de l’identité aux masks.

À conserver:
- principe de sous-seeds dédiées par domaine (surface/moisture/thermal/...).
- reproductibilité tests.

### 2.7 Stratégies perf déjà utiles

- batch instanciation côté Galaxy View,
- seuil instancing tiny planets,
- guardrails de scale/radius,
- séparation budget galaxy vs planet via `createPlanetViewProfile`.

Ces stratégies restent pertinentes, même si la Planet View montera en qualité.

---

## 3. Why the current Planet View is not good enough

### 3.1 Géométrie / silhouette

- Base sphérique déplacée CPU, mais relief encore “low semantics”: pas assez de structures macro distinctives.
- Silhouette varie, mais pas assez pour produire un vrai impact visuel premium en gros plan.
- Une seule logique displacement unifiée, peu de hiérarchie macro/mid/micro.

### 3.2 Relief / topographie perçue

- Données terrain riches mais rendu final n’exprime pas suffisamment la topographie.
- Relief fragment accentué localement sans vraie lecture de masses (bassins/plateaux/chaînes cohérentes).
- Résultat: “bruit détaillé” > “géologie lisible”.

### 3.3 Matériaux / biomes

- Mélanges matière principalement dans un shader fragment unique.
- séparation roche/sol/glace/eau pas assez structurelle (plutôt teintes que matériaux).
- logique biome présente mais visuellement encore trop subtile/plate.

### 3.4 Éclairage

- Lighting stylisé minimal (hémisphère + rim + spec hotspot fixe), donc volume limité.
- manque d’un modèle lumière cohérent pour lire relief et matière.
- pas de vraie articulation jour/nuit exploitable.

### 3.5 Architecture shader

- `SURFACE_FRAGMENT_SHADER_PLANET` concentre trop de responsabilités.
- difficile d’ajouter des features sans rendre le shader ingérable.
- maintenance/itération visuelle coûteuse.

### 3.6 Layers visuelles

- Clouds/atmosphere/ocean layer existent dans les profils, mais ne sont pas activées dans `createPlanetViewProfile`.
- Le pipeline est donc conceptuellement prêt, mais pas réellement livré en Planet View.

### 3.7 Richesse perçue / variété inter-planètes

- Les 500 planètes sont déterministes et techniquement variées,
- mais la variété perceptuelle plafonne: trop de planètes “même famille visuelle” à distance d’inspection.
- manque de signatures visuelles fortes par sous-types.

---

## 4. Visual target for the new Planet View

Cible visuelle (adaptée à Coinage, sans copier la référence):

1. **Relief macro lisible**: continents/masses/bassins visibles immédiatement, sans zoom extrême.
2. **Relief mid détaillé**: chaînes, plateaux, fractures, transitions côtières plus nettes.
3. **Micro-variation contrôlée**: texture de surface fine, jamais bruit “sale”.
4. **Séparation matière claire**:
   - sol/roche,
   - eau,
   - glace,
   - zones thermiques (si famille pertinente),
   - atmosphère/nuages comme couches volumétriques crédibles.
5. **Silhouette plus intéressante**: relief qui influe réellement la perception globale de forme.
6. **Lisibilité biome**: zones froides/chaudes/humides/sèches perceptibles et cohérentes.
7. **Look premium stylisé-crédible**:
   - stylisation conservée (pas photoréalisme brut),
   - shading plus “matériau”, moins “color grading”.
8. **Planète vivante**:
   - rotation lisible,
   - nuages/atmosphère animés subtilement,
   - glow et fresnel propres, jamais cheap.

Objectif qualitatif: quand on ouvre `/planet/:id`, on doit avoir une “présence planète” immédiate, pas juste une sphère correctement colorée.

---

## 5. Recommended rendering architecture

Architecture cible spécifique au repo actuel:

### 5.1 Layer A — Canonical identity (inchangé)

- **Input**: `worldSeed`, `planetSeed`, `planetId`.
- **Source**: `generateCanonicalPlanet`.
- **Output**: `CanonicalPlanet` stable.
- **CPU/GPU**: CPU only.
- **Statut**: **préserver**.

### 5.2 Layer B — Terrain model (refactor léger à moyen)

- **Input**: `CanonicalPlanet.render.surface + noiseSeeds`.
- **Source**: `sampleTerrain` (solid/gaseous) enrichi.
- **Output**: terrain fields hiérarchisés (macro/mid/micro + biome masks plus explicites).
- **CPU/GPU**: CPU sampling pour géométrie + export attributs.
- **Statut**: **garder base, enrichir structure**.

### 5.3 Layer C — Geometry generation (refactor moyen)

- **Input**: terrain fields.
- **Source**: `buildDisplacedSphereGeometry`.
- **Output**: mesh déplacée + attributs normalisés et groupés.
- **CPU/GPU**: displacement CPU (V1), shading GPU.
- **Statut**: **garder approche, refondre qualité displacement et attributs**.

### 5.4 Layer D — Procedural masks contract (nouveau contrat interne)

- **Input**: terrain fields bruts.
- **Output**: blocs cohérents:
  - `macroMask` (continents/bassins),
  - `reliefMask` (mountain/plateau/valley),
  - `biomeMask` (humidity/temperature/ice/arid/thermal),
  - `materialMask` (rock/soil/ocean/ice/lava),
  - `fxMask` (erosion, crater, bands).
- **CPU/GPU**: calcul CPU, consommation GPU.
- **Statut**: **ajouter**.

### 5.5 Layer E — Material layers (refonte forte)

- **Input**: attributes + uniforms dérivés.
- **Output**: albedo/roughness/specular/emissive par couche logique.
- **CPU/GPU**: GPU majoritairement.
- **Statut**: **remplacer shader monolithique par modules surface**.

### 5.6 Layer F — Atmosphere / Clouds / Ocean / Rings (activation structurée)

- **Input**: render profile existant (`planet.render.*`).
- **Output**: meshes/layers réellement activées en Planet View.
- **CPU/GPU**: géométrie simple CPU, shading GPU.
- **Statut**: **activer et fiabiliser progressivement**.

### 5.7 Layer G — Lighting model (refonte moyenne)

- **Input**: normal/worldPos/material params + “stellar direction” unifiée.
- **Output**: shading volumétrique plus lisible, day/night plausible.
- **CPU/GPU**: GPU.
- **Statut**: **remplacer modèle hémisphère actuel**.

### 5.8 Layer H — Final render assembly (refactor moyen)

- **Input**: objets layers + photometry.
- **Source**: `createPlanetRenderInstance` éclaté.
- **Output**: group final + debug snapshot + dispose.
- **CPU/GPU**: mix.
- **Statut**: **éclater en sous-fichiers spécialisés**.

---

## 6. Geometry refactor plan

### Réponse directe

- **Garder `SphereGeometry` déplacée CPU ?** Oui en V1 refonte (meilleur ratio gain/risque).  
- **Enrichir displacement actuel ?** Oui, c’est le levier principal de gain silhouette rapide.  
- **Prévoir LOD futur ?** Oui via contrat/abstraction, même si V1 reste simple.

### Plan concret

1. **Conserver pipeline CPU displacement** (`buildDisplacedSphereGeometry`) mais introduire 3 composantes explicites:
   - macro displacement (continents/bassins),
   - mid displacement (chaînes/plateaux),
   - micro displacement (détail léger).
2. **Re-normaliser amplitude par famille** (terrestre/ice/volcanic/gas) pour éviter silhouettes trop homogènes.
3. **Ajouter un mask “silhouette priority”** pour amplifier uniquement certaines régions et éviter bruit uniforme radial.
4. **Segment budget Planet View**:
   - base actuelle 160 peut rester,
   - mais introduire profil “hq-planet” optionnel (192/224) contrôlé par capacité device.
5. **Compatibilité LOD future**:
   - encapsuler paramètres de géométrie dans un objet dédié (pas directement dans `createPlanetViewProfile`).
   - préparer niveaux `planet-high`, `planet-ultra`, même si un seul activé au début.

### Changement minimal pour gros gain

- Sans changer de primitive ni pipeline GPU: améliorer hiérarchie displacement + pondération famille + normal smoothing calibré => gain visuel immédiat massif sur silhouette et relief.

---

## 7. Procedural generation refactor plan

### Ce qu’on garde

- `noise3`, `fbm`, `ridged`, `craterField`, découpage solid/gaseous.
- seeds dédiées (surface/moisture/thermal/...).
- déterminisme de `sampleTerrain`.

### Ce qu’on restructure

1. **Continents**
   - séparer “continent base shape” et “continent detail warp”.
   - introduire un continent count proxy (faible/moyen/éclaté) dérivé de seed famille.
2. **Montagnes/relief**
   - découpler chaînes structurantes et bruit local.
   - ajouter mask plateaux vs sharp ridges.
3. **Bassins et coastlines**
   - bassin mask explicite (pas juste `oceanLevel` seuil).
   - coast shaping dédié pour éviter littoraux trop uniformes.
4. **Humidity / temperature / biomes**
   - produire un `biomeIndex` ou set de masks normalisés, pas seulement valeurs continues brutes.
5. **Erosion feeling**
   - remplacer simple soustraction par modulation multi-zone (vallées, piedmonts, plateaux).
6. **Cratères**
   - conserver principalement familles rocheuses/volcaniques, réduire ailleurs.

### Ce qu’on ajoute

- **anti-similarity rules** sur 500 planètes:
  - bucket signatures (continent ratio, ruggedness score, ocean ratio, thermal score, palette family)
  - contrainte de distance minimale entre signatures successives dans le manifest (à seed constante, déterministe).
- **visual signature tags** stockés dans `render.debug` pour QA.

### Effet attendu

- planète “lisible” avant même l’éclairage,
- variations inter-planètes plus perceptibles,
- moins de sensation de répétition noise.

---

## 8. Shader / material refactor plan

### Faut-il casser le shader monolithique ?

Oui. C’est la priorité architecture #1.

### Découpage recommandé

1. **Surface core shader**
   - inputs: height/relief/material masks,
   - outputs: base albedo + roughness/spec proxy.
2. **Biome modulation module**
   - temp/humidity/thermal -> coloration & material blend factors.
3. **Detail modulation module**
   - micro variation, erosion tint, crater accents.
4. **Lighting module**
   - diffuse/spec/fresnel/rim structurés et centralisés.
5. **Post-material accents**
   - emissive zones volcaniques/toxic.

Implémentation practical repo:
- extraire GLSL strings en fichiers dédiés (ou const modules TS),
- assembler dans `createPlanetRenderInstance` via blocs.

### Vertex vs Fragment

- **Vertex**:
  - passe attributs,
  - optionnel: précompute certains termes géométriques (slope proxy/light facing coarse).
- **Fragment**:
  - mélange matériau,
  - biomes,
  - lighting principal,
  - fresnel/rim/secondary accents.

### Séparation matériaux/couches

- Surface solide: base rock/soil + overlay biome.
- Ocean: vraie couche active (mesh dédié déjà existant).
- Ice: traité comme matériau explicite (pas juste tint froid).
- Thermal/emissive: réservé familles pertinentes.
- Clouds: layer dédiée transparente animée.
- Atmosphere: shell + scattering stylisé contrôlé.
- Rings: conserver layer dédiée existante, améliorer shading subtil.

Objectif: architecture maintenable où chaque couche a une responsabilité unique.

---

## 9. Lighting and final look

Direction recommandée: **stylisé-crédible amélioré**, pas full physically-based pur.

### Principes

1. Source stellaire directionnelle explicite (unifiée).
2. Diffuse + spec calibrés par matériau (pas hotspot fixe global).
3. Day/night readable:
   - face nuit assombrie proprement,
   - emissive thermique visible seulement où pertinent.
4. Relief readability:
   - contraste orienté pente + normal variation,
   - shadowing stylisé léger (sans pipeline shadow map lourd en V1).
5. Fresnel/rim/atmo glow:
   - dépendants angle vue + densité atmosphère,
   - amplitude bornée pour éviter look cheap “néon contour”.

Résultat visé:
- volume immédiat,
- meilleure lisibilité topographie,
- rendu moins plat, plus “objet céleste”.

---

## 10. Planet layer strategy

### 10.1 Surface principale

- **Activer**: déjà active, à refondre qualité.
- **Priorité**: P0.
- **Bénéfice**: cœur du gain visuel.
- **Coût**: moyen/élevé (shader+procédural).

### 10.2 Ocean layer

- **Activer réellement en Planet View**: oui.
- **Priorité**: P1 (après surface refactor).
- **Bénéfice**: séparation matière immédiate, crédibilité forte.
- **Coût**: faible/moyen (déjà existante, surtout tuning).

### 10.3 Cloud layer

- **Activer**: oui, mais version simple crédible d’abord.
- **Priorité**: P2.
- **Bénéfice**: planète “vivante”, profondeur.
- **Coût**: moyen (transparence/overdraw/perf).

### 10.4 Atmosphere layer

- **Activer**: oui.
- **Priorité**: P2 (en même temps ou juste après cloud).
- **Bénéfice**: silhouette premium + lecture volumique.
- **Coût**: moyen.

### 10.5 Ring layer

- **Conserver active**: oui.
- **Priorité**: P3 (tuning qualitatif).
- **Bénéfice**: différenciation familles géantes.
- **Coût**: faible/moyen.

### 10.6 Optional accent effects

- exemple: polar glow, aurora subtile, storm highlights.
- **Priorité**: P4 (bonus, jamais avant fondations).
- **Bénéfice**: signature premium ponctuelle.
- **Coût**: variable, risque “cheap” si mal dosé.

---

## 11. Variety strategy for ~500 planets

Objectif: diversité perceptuelle, pas juste diversité numérique.

### 11.1 Familles visuelles

- conserver 9 familles, mais ajouter des **sous-profils visuels** déterministes par famille (ex. 3-5 signatures/famille).

### 11.2 Paramètres structurants à renforcer

- continent ratio,
- ruggedness class score,
- basin dominance,
- climate polarity (équatorial/polar contrast),
- material contrast score.

Ces scores doivent influencer directement géométrie + shader.

### 11.3 Palettes

- garder logique palette actuelle,
- ajouter contrôle de contraste intra-planète (deep/mid/high separation),
- éviter collisions de palette via distance colorimétrique simple par bucket.

### 11.4 Relief signatures

- définir signatures de forme (archipelago, supercontinent, fragmented belts, dry highlands...).
- affecter déterministement par seed/famille.

### 11.5 Océans / continents / matières

- varier non seulement coverage, mais **morphologie**:
  - océans vastes profonds,
  - mers intérieures,
  - littoraux fracturés,
  - calottes glaciaires significatives.

### 11.6 Règles anti-planètes-trop-similaires

- générer une `planetVisualSignature` compacte,
- contrôler distribution dans le manifest (re-roll borné déterministe par id) si collision trop forte avec voisines de seed index.
- conserver déterminisme strict via règle de fallback seedée.

---

## 12. Performance and scalability implications

### CPU

- hausse modérée (terrain model enrichi + displacement hiérarchisé).
- acceptable en Planet View (1 planète active), sensible seulement en validation batch massive.

### GPU

- hausse notable (shader plus modulaire + clouds/atmo actifs).
- maîtrisable avec quality tiers Planet View (`high`/`medium`).

### Mémoire

- légère hausse (uniform sets/couches mesh supplémentaires).
- reste contenue sans textures lourdes.

### Géométrie

- coût stable si segments proches de l’actuel.
- attention si “ultra” subdivisions activées sans gating device.

### Layers

- ocean faible coût,
- clouds/atmo coût moyen (transparence),
- rings coût stable existant.

### Shaders

- plus de passes/couches mais code maintenable => meilleure optimisation ciblée possible.

### Safe vs risqué

- **Safe desktop moyen**: surface refactor + ocean + atmosphere légère.
- **Risqué**: clouds volumineux + segment très haut + effets accent cumulés.

### Contrôles indispensables

- garder budget frame Planet View,
- limiter overdraw transparent,
- quality profile par device,
- benchmark systématique par phase.

---

## 13. Incremental implementation plan

### Phase 1 — Shader architecture split + surface quality core

- **Objectif**: casser monolithe et améliorer surface sans toucher aux invariants canonique.
- **Fichiers touchés**:
  - `src/rendering/planet/create-planet-render-instance.ts` (fort)
  - nouveaux fichiers shader modules (à créer)
  - `src/rendering/planet/types.ts` (léger)
- **On change**:
  - extraction modules shader,
  - refonte surface fragment (material layering core).
- **On ne change pas**:
  - seed system,
  - manifest,
  - routes.
- **Gain visuel**: fort immédiat (lisibilité matière + relief shading).
- **Risque**: moyen.

### Phase 2 — Procedural masks V2 + geometry displacement hierarchy

- **Objectif**: améliorer silhouette/relief macro-mid-micro.
- **Fichiers touchés**:
  - `src/rendering/planet/terrain-noise.ts` (fort)
  - `src/rendering/planet/build-displaced-sphere.ts` (fort)
  - `src/domain/world/generate-planet-visual-profile.ts` (moyen, nouveaux paramètres)
- **On change**:
  - masks structurés,
  - displacement hiérarchisé,
  - tuning famille.
- **On ne change pas**:
  - identité canonique conceptuelle,
  - mapping id/seed.
- **Gain visuel**: très fort (silhouette + topographie).
- **Risque**: moyen/élevé (régression visuelle possible).

### Phase 3 — Activation ocean + atmosphere (Planet View)

- **Objectif**: débloquer couches majeures déjà présentes en data.
- **Fichiers touchés**:
  - `generate-planet-visual-profile.ts` (léger tuning)
  - `create-planet-render-instance.ts` (moyen)
- **On change**:
  - `createPlanetViewProfile` active `enableOceanLayer` et `enableAtmosphere` en mode planet,
  - tuning shaders dédiés.
- **On ne change pas**:
  - Galaxy pipeline.
- **Gain visuel**: fort (volume + matière).
- **Risque**: moyen (perf/transparence).

### Phase 4 — Cloud layer + lighting model refinement

- **Objectif**: planète vivante + rendu final premium.
- **Fichiers touchés**:
  - `create-planet-render-instance.ts` (fort)
  - `render-photometry.ts` (léger)
- **On change**:
  - cloud mesh/shader,
  - lighting direction unifiée + day/night tone.
- **On ne change pas**:
  - canonique seeds.
- **Gain visuel**: fort en perception qualitative.
- **Risque**: moyen/élevé (coût GPU).

### Phase 5 — Variety anti-similarity pass + QA hardening

- **Objectif**: robustesse visuelle à 500 planètes.
- **Fichiers touchés**:
  - `generate-planet-visual-profile.ts` (moyen)
  - tests + scripts capture validation (moyen)
- **On change**:
  - signatures visuelles,
  - règles anti-collision perceptuelle,
  - snapshots/régression visuelle automatisée.
- **On ne change pas**:
  - architecture globale des vues.
- **Gain visuel**: moyen/fort à l’échelle globale.
- **Risque**: moyen.

---

## 14. File-by-file refactor map

### Conserver en l’état (ou quasi)

- `src/domain/world/seeded-rng.ts`
- `src/domain/world/resolve-planet-identity.ts`
- `src/domain/world/build-galaxy-planet-manifest.ts` (hors extension mineure optionnelle)
- `src/domain/world/world.constants.ts` (hors tuning)
- `app/planet/[planetId]/page.tsx`
- `app/validation/[planetId]/page.tsx`

### Légèrement modifier

- `src/domain/world/planet-visual.types.ts` (ajout types masks/layers)
- `src/rendering/planet/types.ts` (options qualité Planet View)
- `src/rendering/planet/render-photometry.ts` (exposition/tone tuning)
- `src/ui/planet/PlanetView.tsx` (quality tier, light setup)
- `src/ui/planet/PlanetValidationView.tsx` (modes de comparaison supplémentaires)

### Fortement refactorer

- `src/rendering/planet/create-planet-render-instance.ts` (à découper massivement)
- `src/rendering/planet/terrain-noise.ts` (terrain model v2)
- `src/rendering/planet/build-displaced-sphere.ts` (displacement hierarchy)
- `src/domain/world/generate-planet-visual-profile.ts` (paramétrage visuel v2 + signatures)

### Éclater en plusieurs fichiers (recommandé)

Depuis `create-planet-render-instance.ts` vers:
- `surface/surface-material.ts`
- `surface/surface-shader-chunks.ts`
- `layers/ocean-layer.ts`
- `layers/cloud-layer.ts`
- `layers/atmosphere-layer.ts`
- `layers/ring-layer.ts`
- `lighting/planet-lighting.ts`
- `assembly/create-planet-render-instance.ts`

Et pour procédural:
- `terrain/terrain-sampler.ts`
- `terrain/terrain-masks.ts`
- `terrain/terrain-signature.ts`

### Potentiellement remplacer

- shader surface planet actuel (remplacement complet recommandé, pas patch incremental infini).

---

## 15. Final verdict

- **Peut-on atteindre un rendu nettement meilleur sans full rewrite ?** Oui, clairement.
- **Meilleure stratégie ?** Refonte partielle profonde ciblée sur Planet View rendering/procédural visuel.
- **Plus gros piège à éviter ?** Ajouter des effets “par-dessus” le shader monolithique actuel: dette énorme, gain limité.
- **Meilleur chemin pour un résultat fort rapidement ?**
  1) refondre architecture surface shader,
  2) améliorer displacement hiérarchique,
  3) activer ocean+atmo en Planet View,
  4) finaliser lighting/clouds,
  tout en gardant intacts seed/canonique/manifest.

Conclusion tranchée: **il faut une refonte structurelle du rendu Planet View, mais elle peut être menée de façon incrémentale sans casser la base déterministe existante**.

---

## 16. Appendix — implementation notes for Codex

### Points d’attention techniques

- Ne pas casser le déterminisme: toute nouvelle variabilité doit venir de seeds dérivées.
- Garder la compatibilité des tests existants (identity/radius/cohérence manifest).
- Séparer clairement data generation vs render realization.

### Invariants à ne pas casser

- `resolvePlanetIdentity` doit retrouver exactement la planète manifeste.
- même `worldSeed + planetSeed` => même planète.
- guardrails de rayon/silhouette.
- compatibilité Galaxy View (même si elle reste LQ).

### Pièges à éviter

- monolithe shader v2 “encore plus gros”,
- activation clouds/atmo sans budget perf,
- sur-détail bruité sans lisibilité macro,
- réglages artistiques hardcodés dispersés.

### Éléments à benchmarker

- frame time Planet View (desktop moyen, iGPU),
- draw calls/triangles,
- coût overdraw transparent (cloud/atmo),
- temps build géométrie Planet View.

### Éléments à tester visuellement par phase

- lisibilité silhouette à distance fixe,
- contrastes matière (sol/eau/glace),
- cohérence biome avec seeds,
- stabilité inter-run (captures identiques),
- variété perceptuelle sur un set de 50+ planètes.

---

## 17. First implementation slice recommended

**Premier chantier recommandé: Phase 1 (shader architecture split + surface material core), immédiatement suivie d’un mini-lot Phase 2 sur displacement hierarchy légère.**

### Ce qu’il faut faire en premier

1. Extraire `SURFACE_FRAGMENT_SHADER_PLANET` en modules (core material, biome, lighting).
2. Réécrire le mélange matériau surface pour clarifier roche/sol/ice/eau (même sans activer toutes les couches externes).
3. Ajouter une hiérarchie displacement minimale (macro + mid) dans `buildDisplacedSphereGeometry`.

### Pourquoi ce choix

- c’est le meilleur ratio gain visuel / risque,
- ça prépare proprement toutes les couches futures (ocean/cloud/atmo),
- ça supprime la dette principale (monolithe shader).

### Ce que ça débloque ensuite

- activation propre de l’ocean layer,
- atmosphère et nuages sans empiler du bricolage,
- tuning lighting plus maîtrisable,
- meilleure variété perceptuelle exploitable.

### Pourquoi ce n’est pas un micro polish

Parce que ce chantier change la **structure du pipeline de rendu** (responsabilités, contrats, composabilité), pas seulement quelques coefficients visuels.

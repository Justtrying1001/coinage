# Audit comparatif Planet View — 8 avril 2026

## Méthode
- Audit du pipeline local `coinage` (géométrie, noise, shader, lighting, couches, architecture runtime).
- Audit technique de 3 repos de référence (code source, shaders, génération géométrique, rendu).
- Comparaison axe par axe orientée **résultat visuel final**, pas protection de l’existant.

---

## BLOC 1 — Notre pipeline actuel

### Forces réelles
- **Pipeline déjà structuré en modules** (génération visuelle, géométrie, shader core/biome/lighting). C’est maintenable et lisible. 
- **Terrain CPU relativement riche en signaux**: continents, ridges, rifts, érosion, cratères, thermal, macro/mid/micro relief, masques exposés en attributs de géométrie. 
- **Tentative de matérialisation “material-driven”** dans le shader (pondération sédiment/roche/frost/lava/toxic), pas uniquement du color ramp. 
- **Deux niveaux de vue** (galaxy vs planet), avec un mode planet plus détaillé (mesh + shader dédiés).

### Faiblesses structurelles (bloquantes visuellement)
1. **Couches visuelles majeures coupées dans Planet View**
   - `enableClouds: false`, `enableAtmosphere: false` dans le profil de vue.
   - `renderClouds = false` et `renderAtmosphere = false` au runtime.
   - Résultat: pas de diffusion atmosphérique, pas de profondeur volumétrique, pas de séparation silhouette/fond, planète “nue”.

2. **Lighting stylisé mais non physically-based**
   - Direction lumineuse codée en dur dans shader (`LIGHT_DIRECTION` constant), pas de vraie interaction scène/lumière.
   - Mélange de hacks (hemisphere, rim, slope, tonal clamp) qui donne du contraste local mais pas une lecture matérielle robuste.
   - Une seule lumière ambiante côté scène (`AmbientLight`), pas de key/fill/rim cohérent.

3. **Désalignement relief géométrique vs shading fin**
   - Beaucoup de détails “micro” existent comme masques, mais sans normal map haute fréquence / triplanar detail / multi-échelle texturée.
   - Géométrie à 160 segments en planet view: silhouette correcte, mais micro-lecture de surface reste “peinte” en albedo+tonal.

4. **Surface finale dominée par la colorimétrie et le grading shader**
   - Le rendu perçu est surtout gouverné par `albedo` + `applySurfaceLighting` + clamps/saturation.
   - Les masques complexes sont présents, mais visuellement le gain est amorti par la logique de tonemapping interne shader.

5. **Architecture de famille surtout paramétrique, pas assez morphologique**
   - Différenciation famille = variation de pondérations/teintes/intensités.
   - Peu de signatures structurelles fortes par famille (ex: tectonique reconnaissable, canyons à grande échelle, circulation nuageuse propre, glaces géométriquement marquées, etc.).

### Faux leviers
- Ajouter encore des coefficients de teinte/roughness/spec dans le shader **sans** atmosphère/nuages/matériaux spatialisés n’apportera qu’un gain marginal.
- Affiner encore les masks CPU ne suffit pas si la chaîne de rendu n’exploite pas correctement ces masques en signaux visuels (normales, textures tri-planaires, couches volumétriques, photométrie).

### Dettes du pipeline
- Dette d’architecture de rendu (layers inactifs).
- Dette de photométrie (lumière stylisée rigide, peu liée à la scène).
- Dette de matérialisation (pas de pipeline triplanar/PBR robuste multi-échelle).
- Dette de différenciation “species-level” des planètes (beaucoup de paramètres, peu de signatures visuelles mémorables).

---

## BLOC 2 — Audit repo 1 (dgreenheck/threejs-procedural-planets)

### Architecture générale
- App Three.js compacte: planète shader custom + couche atmosphère en particules + post-process bloom + skybox.
- Paramètres exposés comme uniforms (UI live tweak), favorise itérations visuelles rapides.

### Base géométrique
- Sphère dense (`SphereGeometry(1,128,128)`) avec déplacement vertex via `terrainHeight(...)`.
- Normales de bump recalculées en fragment via dérivées tangentielles (échantillonnage height offset tangent/bitangent).

### Logique terrain/noise
- Simplex 3D + fractal; modes noise distincts dont un mode ridged.
- Height function claire (amplitude, period, persistence, lacunarity, octaves, sharpness, offset).
- Important: chaîne noise lisible et entièrement pilotable en direct.

### Matériaux / textures / layers
- Pas de texturing PBR avancé; layering couleur par seuils de hauteur + blend contrôlé.
- Bump mapping procedural ajouté en shader, ce qui renforce la micro-lecture.
- Atmosphère via nuage de points texturés (cloud sprite) avec animation noise.

### Lighting
- Blinn/Phong stylisé (ambient + diffuse + specular) mais clair et efficace.
- Ajout de bloom subtil qui augmente la présence perçue de l’astre.

### Pourquoi le rendu paraît meilleur que chez nous (malgré simplicité)
- Pipeline plus “lisible visuellement”: relief et éclairage racontent la même forme.
- Atmosphère active + post process => meilleure séparation planète/fond.
- Plus de cohérence perceptive globale que de sophistication locale.

### Réutilisable chez nous
- Discipline de paramètres artistiques en temps réel.
- Bump/detail normal procedural aligné avec le heightfield.
- Couches additionnelles simples mais actives (atmosphère + bloom léger).

---

## BLOC 3 — Audit repo 2 (XenoverseUp/procedural-planets)

### Architecture générale
- Architecture moderne React Three Fiber, avec deux pipelines: **CPU** et **GPU compute**.
- Planète construite en **cube-sphere à 6 faces** (terrain face par face), pas une sphere UV unique.

### Logique terrain/noise
- Multi-filtres noise (simple + ridged), paramètres complets: strength, roughness, baseRoughness, persistence, minValue, layerCount, mask first layer.
- Hiérarchie de relief via combinaison de filtres, dont un masque de couche primaire.
- Pipeline proche d’une approche “planet generator tool” (édition live des filtres).

### Part GPU / CPU
- GPU compute fragment shader calcule positions (XYZ + unscaled elevation) dans render target float, relu côté CPU pour construire buffers.
- Version CPU équivalente disponible (parité d’algorithme).
- Structure prête pour évoluer vers volumes plus lourds sans bloquer UX.

### Hiérarchie du relief
- Relief généré explicitement par couches, min/max elevation tracké globalement.
- Ce min/max pilote ensuite le shading (gradient elevation vs depth) avec normalisation stable.

### Rendu matière
- Base shading plus simple que votre shader actuel, mais plus propre conceptuellement:
  - gradient profondeur/hauteur,
  - blend configurable hard/soft,
  - base material physique (`MeshPhysicalMaterial`) enrichie shader.
- Atmosphère dédiée (fresnel-like additive backside).

### Pourquoi le résultat paraît qualitatif
- Solide sur la **cohérence architecturelle**: géométrie, noise, coloration et tooling vont dans la même direction.
- La lisibilité des macroformes est bonne grâce au cube-sphere + filtres noise bien contrôlés.
- Le système est extensible (important pour atteindre haute qualité après itérations).

### Ce qu’on peut reprendre
- Modèle cube-sphere par faces + pipeline compute (ou compute-like) pour scalabilité.
- Système de noise layers éditable et explicite.
- Normalisation min/max pilotant proprement la coloration et les transitions.

---

## BLOC 4 — Audit repo 3 (prolearner/procedural-planet)

### Architecture générale
- Projet plus ancien, mais très riche en techniques de rendu planète.
- Multiples options de géométrie/noise/LOD (sphere, icosahedron, spherical cube, CLOD/quadtree, GPU displacement option).

### Choix de géométrie
- Permet sphere, icosahedron, spherical cube.
- Par défaut utilise icosahedron pour terrain plein, et mode CLOD/quadtree possible pour grande échelle.

### Triplanar texturing
- Point fort majeur: shader fragment mélange textures sable/herbe/roche/neige via pondération par composantes de normale (`blending = abs(normal)`), évitant étirement UV.
- Transitions matière pilotées par altitude offset (distance au rayon de base).
- Résultat: lecture matière beaucoup plus crédible que color ramps purs.

### Water / sky / atmosphere / clouds
- Couches distinctes:
  - eau avec normal map animée,
  - sky sphere,
  - clouds (double couche front/back transparente),
  - atmosphère (shader dédié, même si perfectible).
- Même si certains shaders sont datés, l’empilement des couches améliore fortement la perception finale.

### LOD
- Quadtree CLOD avec critère distance caméra + niveaux persistants.
- Variante QTGPU pour displacement dans vertex shader (annoncée coûteuse).
- Bonne référence conceptuelle pour planet view zoomable.

### Pourquoi visuellement plus mature
- Combine plusieurs ingrédients indispensables ensemble: relief + matériaux spatiaux + eau + nuages + ciel + (pseudo-)atmosphère + LOD.
- Même sans PBR moderne, la richesse de couches produit une planète “vivante”.

### Ce qu’on peut reprendre
- Approche triplanar matériau (à moderniser en PBR).
- Architecture multi-couches (surface/eau/clouds/atmo/sky).
- Idées CLOD/quadtree pour profond zoom.

---

## BLOC 5 — Comparaison directe (axes techniques)

| Axe | Pipeline actuel | dgreenheck | XenoverseUp | prolearner | Verdict axe |
|---|---|---|---|---|---|
| Géométrie / forme | Sphere UV déplacée CPU, 160 seg en Planet View | Sphere UV dense + displacement shader | Cube-sphere 6 faces, CPU ou compute GPU | Icosa/sphere/cube + CLOD | Vous êtes derrière Xenoverse/prolearner sur robustesse structurelle |
| Terrain / noise | Riche en signaux (macro/mid/micro + masques), mais rendu final amortit | Noise plus simple mais cohérent et lisible | Noise layers explicites + masking + outillage | Noise ancien mais combiné à LOD et couches | Votre génération brute est bonne, votre exploitation visuelle est insuffisante |
| Matériaux / texturing | Shader complexe mais sans triplanar/texture detail robuste | Layer color + bump procedural | Gradient shading propre, extensible | Triplanar textures multi-matériaux | Gros manque côté texturing/matériaux spatialisés |
| Lighting / photométrie | Stylisé hardcodé, AmbientLight dominant | Diffuse/spec clair + bloom | Base physique + shader custom | Directional simple mais couplé couches | Lighting actuel trop “plat contrôlé”, pas assez physique |
| Couches visuelles | Océan + anneaux; clouds/atmo désactivés | Atmosphère active + bloom | Atmosphère active | Eau + nuages + sky + atmo | Retard majeur: couches clés inactives chez vous |
| Différenciation familles | Surtout paramétrique color/coeffs | Param tweaking global | Dépend presets noise/gradients | Dépend géo+textures+couches | Vos familles manquent de signatures morphologiques fortes |
| Perf / complexité / LOD | Simple, stable, mais plafond qualité | Léger | Bon compromis grâce option GPU | Ambitieux mais ancien/coûteux | Stratégie cible: modèle Xenoverse + concepts prolearner |

---

## BLOC 6 — Verdict

### Réponse tranchée
**C. Remplacer une grosse partie par une architecture inspirée principalement de XenoverseUp, en injectant les idées de matérialisation multi-couches de prolearner.**

### Pourquoi (sans diplomatie)
- Continuer à tuner votre shader actuel ne franchira pas le gap de qualité attendu: le blocage est structurel (couches inactives + lighting non physique + matérialisation insuffisante).
- Votre noise CPU est déjà riche: **ce n’est pas votre principal problème**.
- Le principal problème est la chaîne “du relief vers l’image”: matériaux, photométrie, couches atmosphériques/nuageuses, cohérence multi-échelle.

### Ce qu’il ne faut pas faire
- **A (itérer léger sur l’existant)**: insuffisant.
- **D (repartir de zéro total)**: trop coûteux et inutile car vous avez des briques réutilisables (seeding, familles, noise masks).

---

## BLOC 7 — Plan d’action concret

### Phase 0 — Décision d’architecture (court, 2–3 jours)
1. Geler le pipeline visuel actuel en “legacy”.
2. Définir nouveau contrat de rendu: `geometry -> height/normal/tangent -> material layers -> lighting -> post -> atmosphere/cloud/water`.
3. Choisir base technique:
   - géométrie: cube-sphere 6 faces,
   - génération: conserver vos noises + option compute progressive.

### Phase 1 — Refonte socle géométrie + données (1 sprint)
1. Introduire cube-sphere (inspiré Xenoverse).
2. Migrer vos masks actuels vers un format de “terrain fields” commun par vertex/texel.
3. Ajouter normalisation min/max globale (comme Xenoverse) pour stabiliser coloration inter-planètes.

### Phase 2 — Refonte matériaux (1 sprint)
1. Implémenter **triplanar material stack PBR** (roche/sédiment/glace/lave/eau peu profonde/profonde).
2. Remplacer color-only blending par material-driven blending (albedo + roughness + normal + AO par couche).
3. Garder vos familles, mais les faire piloter des **bundles de matériaux**, pas juste des couleurs.

### Phase 3 — Lighting & photométrie (0.5–1 sprint)
1. Supprimer la direction hardcodée shader; brancher une vraie directional light scène.
2. Ajouter IBL/HDR léger + exposition calibrée + bloom subtil.
3. Réduire les hacks de tonal interne shader qui écrasent la matière.

### Phase 4 — Couches atmosphère/nuages/eau (1 sprint)
1. Réactiver clouds/atmosphere en priorité (actuellement off).
2. Atmosphère: modèle simple type fresnel + extinction (itération 1), puis scattering approximé (itération 2).
3. Nuages: couche volumétrique légère ou shell animé noise; vitesse et densité par famille.
4. Eau: spéculaire/fresnel/normal animé cohérent avec vent/latitude.

### Phase 5 — Différenciation familles “structurelle” (1 sprint)
1. Définir 6–8 signatures morphologiques fortes (tectonique, cryo, volcanisme, dunes, archipels, etc.).
2. Lier chaque famille à:
   - profil noise macro/mid/micro,
   - set matériaux,
   - atmosphère/nuages/eau,
   - photométrie secondaire.
3. Éviter que la différenciation repose majoritairement sur teinte.

### Phase 6 — LOD/performance et migration progressive (continu)
1. Garder pipeline legacy en fallback tant que nouveau pipeline n’atteint pas la parité fonctionnelle.
2. Basculer progressivement familles (ex: terrestres puis océaniques puis extrêmes).
3. Ajouter LOD par distance caméra (inspiration quadtree prolearner si zoom profond requis).

### Ce qu’on garde / jette
- **À garder**: seeding, taxonomy familles, logique noise existante (bonne base), outillage debug.
- **À refondre fortement**: géométrie runtime planet view, shading/lighting, matérialisation surface.
- **À remplacer presque entièrement**: gestion des couches visuelles (atmo/cloud/water) car l’actuelle est essentiellement inactive.

---

## Conclusion exécutive
Vous n’êtes **pas** loin d’un bon générateur de données de terrain; vous êtes loin d’un bon **pipeline d’image planète**. Le problème principal n’est plus la noise math, c’est la chaîne de rendu. La voie la plus réaliste vers une haute qualité visuelle est une refonte forte du rendu inspirée de XenoverseUp (architecture) + prolearner (matériaux/couches), tout en conservant vos briques procédurales déjà solides.

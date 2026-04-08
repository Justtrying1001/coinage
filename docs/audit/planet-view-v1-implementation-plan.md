# Planet View V1 Implementation Plan

## 1. V1 goal

Cette V1 doit livrer un saut visuel net sur la Planet View **sans toucher aux fondations canonique/déterministes** déjà solides. Le résultat attendu est une planète qui, à seed identique, paraît immédiatement plus crédible et plus “présente” : relief plus lisible, meilleure séparation matière, lighting moins plat, silhouette plus intéressante.

Cette V1 **ne cherche pas** à finaliser toute la refonte planète. Elle ne vise pas encore un système complet clouds premium, ni une stratégie anti-similarity avancée, ni un pipeline PBR lourd. Elle vise un premier lot à fort ROI visuel qui corrige le principal goulot actuel : surface render monolithique et sous-exploitée.

C’est le meilleur premier chantier parce qu’il:
- attaque directement la cause principale du plafond qualité,
- préserve l’architecture canonique existante,
- prépare proprement les couches futures (ocean/atmosphere/clouds) sans sur-scoper,
- limite le risque produit en restant centré Planet View.

---

## 2. Strict V1 scope

### Shader architecture
- découper le shader surface planète monolithique en modules maintenables (core surface, biome modulation, lighting block).
- conserver une seule surface layer active, mais mieux structurée.

### Surface material layering
- rendre explicite la séparation matière (terrain bas/mid/haut, zones rocheuses, zones humides/sèches, zones froides/chaudes).
- améliorer les transitions (côtes, hauts reliefs, basses terres) avec les attributs existants.

### Displacement improvements
- conserver la `SphereGeometry` déplacée CPU.
- introduire une hiérarchie displacement V1 (macro + mid + micro léger) pour améliorer silhouette et lecture relief.

### Lighting improvements
- remplacer l’éclairage “plat stylisé minimal” par un modèle stylisé-crédible plus lisible (direction de lumière claire, meilleure lecture de pente/volume, day/night plus propre).

### Render assembly cleanup
- réduire la concentration de responsabilités dans `create-planet-render-instance.ts`.
- extraire les blocs surface/light/shader assemblage, sans réécrire tout le renderer.

### Optional minimal ocean/atmosphere preparation (justifiée)
- **préparation uniquement**: laisser des points d’extension propres pour activer ocean/atmosphere plus tard.
- activation réelle possible uniquement si coût/risk faible et sans détourner le scope.

### Included
- refactor architecture shader surface Planet View.
- amélioration visible matériau surface.
- displacement V1 plus lisible.
- lighting V1 plus volumique.
- nettoyage d’assemblage rendu pour éviter dette.
- validation visuelle structurée + tests invariants.

### Excluded
- système clouds premium.
- système anti-similarity global 500 planètes.
- refonte Galaxy View.
- système LOD complexe.
- refonte totale PBR.
- FX bonus (aurora/storms décoratifs, etc.).

---

## 3. Non-goals

Codex ne doit pas faire dans cette V1:

1. **Ne pas changer le seed system** (`seeded-rng.ts`, labels de seed, logique de déterminisme).  
2. **Ne pas casser la canonical identity** (`CanonicalPlanet`, `PlanetIdentity`, mapping render de base).  
3. **Ne pas casser manifest/résolution** (`build-galaxy-planet-manifest.ts`, `resolve-planet-identity.ts`).  
4. **Ne pas refondre Galaxy View** (instancing/batching/caméra galaxie hors impact mineur indirect).  
5. **Ne pas implémenter un cloud system ambitieux** (volumetric lourd, multi-scattering, etc.).  
6. **Ne pas implémenter anti-similarity avancée** (règles globales manifest complexes).  
7. **Ne pas multiplier les effets gadget** qui masquent les faiblesses du core surface.  
8. **Ne pas introduire un framework rendu sur-abstrait** qui ralentit l’itération V1.  
9. **Ne pas empiler du code dans le shader monolithique existant**: le but est le découpage, pas l’enrichissement brut du bloc actuel.

---

## 4. Visual acceptance criteria

La V1 est visuellement réussie si, sur un panel de planètes représentatif:

1. **Relief lisible à distance fixe**: on distingue clairement masses, transitions et zones hautes/basses sans zoom extrême.
2. **Fin de l’effet “sphère colorée lissée”**: la surface paraît structurée, pas juste teintée.
3. **Séparation matière immédiate**: eau/terre/roche/glace (selon type) sont perceptibles en un coup d’œil.
4. **Lighting plus volumique**: le volume et les pentes sont mieux révélés, sans contraste artificiel cheap.
5. **Silhouette plus intéressante**: la forme globale paraît moins uniforme et plus planétaire.
6. **Rendu premium sans clouds avancés**: même sans couche cloud complète, la planète paraît déjà nettement plus séduisante.
7. **Cohérence inter-seeds**: chaque planète conserve sa signature, mais la qualité perçue est uniformément plus haute.

---

## 5. Technical acceptance criteria

Critères techniques à respecter impérativement:

1. **Déterminisme intact**: même `worldSeed + planetSeed` => même rendu planète V1 (hors bruit non-seedé hors planète).  
2. **Compatibilité canonique**: pas de rupture entre `CanonicalPlanet` et Planet View runtime.  
3. **Manifest/résolution intacts**: pas de régression `buildGalaxyPlanetManifest` / `resolvePlanetIdentity`.  
4. **Routes intactes**: `/planet/[planetId]` et `/validation/[planetId]` fonctionnent sans changement contractuel cassant.  
5. **Coût GPU maîtrisé**: pas d’explosion non contrôlée (surcoût acceptable, mais borné et mesuré).  
6. **Code maintainable**: fin du “tout-dans-un” shader surface; modules distincts avec responsabilités claires.  
7. **No hidden scope creep**: aucun ajout non prévu dans non-goals.

Critères testables minimum:
- suite de tests existants passe,
- snapshots/validation visuelle comparée avant/après,
- inspection de structure fichiers (split réel effectué).

---

## 6. Recommended implementation strategy

### Chantier A — Split render assembly (surface-first)
- **But**: sortir la logique surface/light/shader de `create-planet-render-instance.ts`.
- **Fichiers**: `src/rendering/planet/create-planet-render-instance.ts` + nouveaux modules `src/rendering/planet/surface/*`.
- **Risque**: moyen.
- **Gain visuel attendu**: indirect (débloque les chantiers visuels sans dette).
- **Dépendances**: aucune, à faire en premier.

### Chantier B — Surface shader modularization
- **But**: remplacer le bloc monolithique surface planet par modules (`surface-core`, `biome`, `lighting`).
- **Fichiers**: nouveaux modules shader + intégration assembly.
- **Risque**: moyen/élevé (régression rendu si migration partielle).
- **Gain visuel attendu**: fort (matériaux et lisibilité).
- **Dépendances**: Chantier A.

### Chantier C — Displacement hierarchy V1
- **But**: renforcer silhouette/relief perçu sans changer de primitive.
- **Fichiers**: `src/rendering/planet/build-displaced-sphere.ts`, `src/rendering/planet/terrain-noise.ts`.
- **Risque**: moyen.
- **Gain visuel attendu**: fort (forme + topographie).
- **Dépendances**: peut démarrer après A, idéalement en parallèle de B.

### Chantier D — Lighting cleanup V1
- **But**: établir un lighting stylisé-crédible lisible et stable.
- **Fichiers**: modules lighting shader + `render-photometry.ts` (tuning léger).
- **Risque**: moyen.
- **Gain visuel attendu**: fort (volume perçu).
- **Dépendances**: B.

### Chantier E — Final tuning + prep ocean/atmosphere hooks
- **But**: calibrer rendu final V1 et laisser points d’extension propres pour couches futures.
- **Fichiers**: assembly + surface modules + éventuelle légère extension types.
- **Risque**: faible/moyen.
- **Gain visuel attendu**: moyen/fort (cohérence finale).
- **Dépendances**: B + C + D.

---

## 7. File-by-file V1 action map

| Fichier | Action | Pourquoi | Priorité |
|---|---|---|---|
| `src/rendering/planet/create-planet-render-instance.ts` | **split + heavy refactor** | Concentration excessive des responsabilités, point central V1 | P0 |
| `src/rendering/planet/build-displaced-sphere.ts` | **heavy refactor** | Displacement hiérarchique V1 pour silhouette/relief | P0 |
| `src/rendering/planet/terrain-noise.ts` | **light edit à medium refactor** | Produire entrées plus exploitables pour displacement/material | P1 |
| `src/rendering/planet/render-photometry.ts` | **light edit** | Ajustement exposition/tone pour nouveau lighting | P2 |
| `src/rendering/planet/types.ts` | **light edit** | Contrat options/render plus clair après split | P2 |
| `src/domain/world/generate-planet-visual-profile.ts` | **light edit (optionnel)** | Ajustements paramétriques V1 si besoin strictement nécessaire | P2 |
| `src/ui/planet/PlanetView.tsx` | **light edit** | éventuel hook qualité/tuning caméra/lumière compatible V1 | P3 |
| `src/ui/planet/PlanetValidationView.tsx` | **light edit** | faciliter comparaison visuelle V1 | P3 |
| `src/rendering/planet/surface/surface-core.glsl.ts` (nouveau) | **create new** | base matériau surface | P0 |
| `src/rendering/planet/surface/surface-biome.glsl.ts` (nouveau) | **create new** | modulation biomes/matières | P0 |
| `src/rendering/planet/surface/surface-lighting.glsl.ts` (nouveau) | **create new** | lighting structuré | P0 |
| `src/rendering/planet/surface/surface-shader-assembly.ts` (nouveau) | **create new** | assemblage shader surface propre | P0 |

Fichiers explicitement **keep** V1:
- `src/domain/world/seeded-rng.ts`
- `src/domain/world/build-galaxy-planet-manifest.ts`
- `src/domain/world/resolve-planet-identity.ts`
- `app/planet/[planetId]/page.tsx`
- `app/validation/[planetId]/page.tsx`
- `src/ui/galaxy/GalaxyView.tsx` (hors effets collatéraux non souhaités)

---

## 8. Proposed target architecture for V1 only

### `create-planet-render-instance.ts` devient un orchestrateur mince

Rôle V1 cible:
1. récupère profile/render data,
2. appelle `buildPlanetSurfaceGeometry(...)`,
3. appelle `buildPlanetSurfaceMaterial(...)`,
4. assemble mesh surface + rings existants,
5. expose `dispose` et debug snapshot.

### Modules shaders V1

- `surface-core`: albedo de base + transitions altitudes/masks.
- `surface-biome`: modulation humidity/temperature/continent/erosion.
- `surface-lighting`: diffuse/spec/rim/fresnel stylisé borné.
- `surface-shader-assembly`: compose vertex+fragment final sans monolithe unique.

### Surface decoupage V1

- **Geometry stage (CPU)**: displacement hiérarchique + attributs existants préservés.
- **Material stage (GPU)**: layering matière lisible (terre/roche/eau/glace selon masks).
- **Lighting stage (GPU)**: lecture volume/pentes améliorée.

### Géométrie intégrée (pas de rupture)

- `build-displaced-sphere.ts` reste la porte d’entrée géométrie.
- on enrichit sa logique, on ne remplace pas le paradigme.

### Compatibilité canonique

- aucun changement de contrat “identity -> render profile -> render instance” cassant.
- Planet View continue de consommer `resolved.planet` depuis le manifeste canonique.

---

## 9. Order of implementation

1. **Split assembly sans changer le rendu**  
   Justification: sécurise la suite, réduit le risque de régression confuse.

2. **Migrer shader surface en modules (parité visuelle d’abord)**  
   Justification: casser le monolithe avant d’ajouter de nouvelles responsabilités visuelles.

3. **Appliquer amélioration displacement V1 (macro/mid/micro léger)**  
   Justification: meilleur levier pour silhouette/relief immédiatement visibles.

4. **Ajouter lighting V1 et retuning matériau**  
   Justification: finalise le saut perceptuel une fois structure propre en place.

5. **Tuning final + validation visuelle rigoureuse**  
   Justification: verrouiller qualité avant d’ouvrir la phase suivante.

---

## 10. Risks and failure modes

### Risque 1 — Modularisation incomplète
- **Pourquoi**: split partiel, vieux bloc monolithique toujours central.
- **Prévention**: imposer règle “aucune nouvelle logique dans ancien bloc”, migration complète surface.

### Risque 2 — Shader plus compliqué mais pas plus lisible
- **Pourquoi**: découpage nominal sans vraie séparation de responsabilités.
- **Prévention**: contrats stricts par module (core/biome/light), revue ciblée.

### Risque 3 — Gain visuel insuffisant
- **Pourquoi**: changement surtout structurel, peu de tuning matière/relief.
- **Prévention**: critères visuels obligatoires + captures comparatives à chaque milestone.

### Risque 4 — Relief plus fort mais mal lu
- **Pourquoi**: displacement amplifié sans lighting adapté.
- **Prévention**: itérer displacement + lighting ensemble en fin de lot.

### Risque 5 — Lighting agressif/cheap
- **Pourquoi**: rim/fresnel/spec trop poussés.
- **Prévention**: bornes strictes + validation sur familles variées.

### Risque 6 — Surcoût GPU
- **Pourquoi**: complexité fragment excessive.
- **Prévention**: profiler tôt, limiter branches coûteuses, garder V1 simple.

### Risque 7 — Tuning dispersé
- **Pourquoi**: constantes éparpillées dans plusieurs fichiers.
- **Prévention**: centraliser paramètres V1 dans blocs clairs (surface + lighting config).

---

## 11. Test and validation plan

### Tests à garder
- suite actuelle complète (`npm test`), en particulier:
  - déterminisme génération,
  - cohérence manifest/résolution,
  - budgets galaxy/planet existants.

### Tests à ajouter (V1)
1. **Surface shader modularization guardrail**: vérifier présence/usage des nouveaux modules et absence de logique critique dans ancien monolithe.
2. **Displacement hierarchy deterministic**: même seed => mêmes attributs/positions (tolérance float contrôlée).
3. **Planet View invariants**: rendu instanciable en mode planet sans casser debug snapshot.

### Validation visuelle
- utiliser `scripts/capture-visual-validation.ts` avec focus mode `planet`.
- générer avant/après via `scripts/capture-before-after.ts`.

### Set de planètes à tester
- minimum 2 planètes par famille (9 familles => 18 planètes).
- inclure cas extrêmes (gaseous, ringed, volcanic, barren, oceanic).

### Inspection manuelle obligatoire
- lecture relief à distance caméra fixe,
- qualité séparation matière,
- cohérence lumière day-side / night-side,
- absence d’artefacts shader (banding/aliasing/flicker),
- cohérence inter-planètes.

---

## 12. Definition of done

La V1 est terminée quand:

1. **Architecture**: surface render n’est plus monolithique, `create-planet-render-instance.ts` est allégé et orienté orchestration.
2. **Visuel**: critères section 4 validés sur le panel planètes.
3. **Invariants**: critères section 5 validés (déterminisme/canonique/routes/tests).
4. **Validation**: captures avant/après montrent un gain net et reproductible.
5. **Dette contrôlée**: aucun ajout hors scope V1.

Livrables attendus:
- code refactor V1,
- captures comparatives,
- résultats tests,
- note courte des paramètres finaux retenus.

Signaux pour passer à la suite:
- base surface/lighting stable,
- qualité Planet View objectivement meilleure,
- hooks propres prêts pour ocean/atmosphere/clouds phase suivante.

Problèmes acceptés pour phase suivante:
- clouds avancés,
- anti-similarity globale,
- LOD avancé,
- FX premium additionnels.

---

## 13. First coding slice

### Première tranche exacte à lancer

**Objectif intermédiaire**: obtenir parité visuelle (ou légère amélioration) avec architecture déjà split, sans toucher au cœur canonique.

### Commencer par ces fichiers
1. `src/rendering/planet/create-planet-render-instance.ts`
2. créer `src/rendering/planet/surface/surface-shader-assembly.ts`
3. créer `src/rendering/planet/surface/surface-core.glsl.ts`
4. créer `src/rendering/planet/surface/surface-biome.glsl.ts`
5. créer `src/rendering/planet/surface/surface-lighting.glsl.ts`

### Extraire en premier
- toute la logique GLSL surface planet (vertex/fragment) vers modules,
- puis réintégrer via un assembleur unique appelé par le renderer.

### Ne surtout pas toucher encore
- `seeded-rng.ts`,
- `build-galaxy-planet-manifest.ts`,
- `resolve-planet-identity.ts`,
- routes app,
- Galaxy View.

### Premier résultat intermédiaire visé
- code shader surface modulaire en place,
- `create-planet-render-instance.ts` simplifié,
- rendu Planet View non régressé fonctionnellement,
- base prête pour itération displacement+lighting V1 immédiate.

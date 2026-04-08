# Planet View V1 Overlap Audit

## 1. Executive summary

- L’état actuel du chantier V1 est **globalement propre et exploitable**: la modularisation shader est réelle et la hiérarchie displacement est effectivement branchée.  
- Il y a toutefois des **signaux précoces de dette**: recouvrement partiel core/biome, contrat attributaire plus large que l’usage réel, et accumulation de coefficients “inline”.  
- On peut continuer sereinement, mais il faut faire une **mini passe cleanup faible risque** avant d’empiler la suite (sinon dette de lisibilité/tuning rapide).  
- Risque principal à court terme: glisser vers un pipeline “fonctionnel mais opaque” (beaucoup de masques/coefs sans hiérarchie claire).

---

## 2. Current surface architecture status

- `create-planet-render-instance.ts` est **plus mince qu’avant sur la surface** (import de shader assembly + usage direct), donc l’objectif V1 de dé-monolithisation est atteint côté surface.  
- Le découpage `surface-core` / `surface-biome` / `surface-lighting` / `surface-shader-assembly` est réel et utile.  
- Responsabilités globalement claires:
  - core = construction état matériau,
  - biome = modulation climatique,
  - lighting = modèle d’éclairage,
  - assembly = câblage final.
- Point ambigu actuel: la frontière core/biome n’est pas totalement nette (une part de modulation “humidité” existe déjà en core, puis biome retouche encore).

---

## 3. Overlap analysis

### Overlap matériau core vs biome

- `surface-core` applique déjà une modulation humidité (`moistureBlend`) sur `terrain`, puis `surface-biome` applique une deuxième couche climatique.  
- Ce n’est pas faux, mais la responsabilité “climat” est déjà partagée entre deux modules -> début de recouvrement.

### Overlap lighting / state

- `surface-core` calcule `reliefShade` (logique orientée lighting), ensuite `surface-lighting` le reconsomme avec ses propres pondérations.  
- Acceptable, mais fragile si on continue à répartir la logique lumière entre core et lighting.

### Rôle assembly

- L’assembly fait bien le câblage des modules, mais calcule deux fois le lighting (`litColor`, `landLitColor`) puis mixe selon `vLandMask`.  
- C’est lisible, mais commence à mélanger orchestration et logique de blend final.

### Interaction geometry/terrain/shader

- Nouveau contrat displacement (macro/mid/micro/silhouette) est bien connecté de `terrain-noise` -> `build-displaced-sphere` -> vertex varyings -> fragment.  
- Bon point: pas de chemin fantôme pour ces nouveaux attributs.

### Anciens comportements potentiellement redondants

- Branche gazeuse conserve ses anciens patterns tout en recevant les nouveaux signaux macro/mid; ce mélange peut devenir redondant si non clarifié plus tard (pas bloquant immédiat).

---

## 4. Dead code / obsolete path candidates

Candidats justifiés par le code actuel:

1. `vCraterMask` est transporté jusqu’au shader surface mais non exploité dans la nouvelle passe matériau/lighting actuelle.  
2. `uSeed` est injecté au material surface même en Planet HQ; il sert surtout la branche galaxy fragment. Pas “mort”, mais usage asymétrique et ambigu.  
3. Nouveaux attributs geometry (`aMacroRelief`, `aMidRelief`, `aMicroRelief`, `aSilhouetteMask`) sont bien utilisés; **pas dead code** ici.  
4. `aBandMask`/`vBandMask` reste justifié (branche gazeuse + emissive mix).

Aucun gros bloc “legacy monolithique surface” n’a été retrouvé: la suppression est effective.

---

## 5. Data contract sanity check

- Contrat geometry -> shader est fonctionnel et cohérent: les attributs clés sont propagés et utilisés.  
- Le contrat commence toutefois à devenir dense (beaucoup de varyings), ce qui augmente le risque de confusion si on continue sans normalisation légère.
- Attributs vraiment utiles maintenant:
  - `aHeight`, `aLandMask`, `aTemperatureMask`, `aHumidityMask`,
  - `aMacroRelief`, `aMidRelief`, `aMicroRelief`, `aSilhouetteMask`,
  - `aCoastMask`, `aOceanDepth`, `aBandMask`, `aThermalMask`.
- Attribut potentiellement en trop à l’instant T: `aCraterMask` côté shader surface V1 (transporté mais non exploité).
- État global: **encore maintenable**, mais proche d’un seuil où il faudra documenter/resserrer les rôles des masques.

---

## 6. Tuning / parameter sprawl check

- Oui, le risque de “parameter sprawl” a commencé:
  - core contient de nombreux coefficients hardcodés (mix/smoothstep/pondérations),
  - biome ajoute ses propres intensités,
  - lighting ajoute encore sa couche de coefficients.
- Le système reste compréhensible aujourd’hui, mais la hiérarchie “où régler quoi” devient moins évidente.
- Fragilité émergente: un même effet visuel (ex. humidité/contraste relief) est influencé par plusieurs modules et plusieurs coefficients.

---

## 7. Cleanup actions recommended now

Actions petites, ciblées, faible risque:

1. **Retirer `vCraterMask` du vertex->fragment surface tant qu’il n’est pas utilisé** (ou l’utiliser explicitement).  
2. **Clarifier la frontière climat**: garder la modulation climat principale en `surface-biome`, et réduire la correction humidité en core (ou inverse), mais pas les deux forts à la fois.  
3. **Regrouper 6–10 coefficients critiques par module en constantes nommées** (sans nouveau système global), pour éviter les “magic numbers” dispersés.  
4. **Ajouter un court commentaire de contrat dans chaque module** (ce module possède X responsabilités et pas Y).

Aucune de ces actions ne demande refonte lourde.

---

## 8. Must-fix before next phase vs can-wait

### Must-fix now

1. Lever l’ambiguïté core vs biome sur la modulation climat (éviter overlap durable).  
2. Éliminer/justifier `vCraterMask` inutilisé côté surface shader.

### Can wait

1. Rationalisation plus large des coefficients en data-driven config.  
2. Nettoyage fin branche gazeuse vs solide.  
3. Réduction plus agressive du nombre total de varyings (tant que perf/typecheck restent OK).

---

## 9. Final verdict

- **Oui**, le chantier est encore globalement propre.  
- **Oui**, on peut continuer en confiance.  
- **Oui**, une mini passe cleanup est recommandée maintenant (courte, faible risque).  
- Plus gros risque si on continue sans vérifier: accumuler des overlaps de tuning core/biome/lighting, rendant les prochaines itérations plus coûteuses et moins prévisibles.

---

## 10. Appendix — evidence

Fichiers regardés:
- `src/rendering/planet/create-planet-render-instance.ts`
- `src/rendering/planet/surface/surface-shader-assembly.ts`
- `src/rendering/planet/surface/surface-core.glsl.ts`
- `src/rendering/planet/surface/surface-biome.glsl.ts`
- `src/rendering/planet/surface/surface-lighting.glsl.ts`
- `src/rendering/planet/build-displaced-sphere.ts`
- `src/rendering/planet/terrain-noise.ts`

Points concrets observés:
- modularisation effective (plus de gros bloc surface inline),
- nouveaux attributs displacement bien propagés et utilisés,
- overlap climat core/biome,
- un varying transporté non exploité (`vCraterMask`),
- multiplication des coefficients de tuning sur 3 modules.

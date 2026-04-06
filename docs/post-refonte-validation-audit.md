# Audit de validation post-refonte — moteur planète

Date: 2026-04-06

## Validation summary

- Le repo n'expose plus l'ancien pipeline planète (mapper procedural uniforms, terrain worker, anciens shaders/constantes identité) en code actif.
- Galaxy View et Planet View lisent la même entité `CanonicalPlanet` via manifest/résolution partagés.
- Le moteur est déterministe (même worldSeed + planetSeed => même planète canonique).
- Les couches de rendu sont séparées (surface/clouds/atmosphere/rings) avec toggles debug de visibilité.
- **Risque détecté**: la lisibilité minimale en Galaxy View n'est pas totalement garantie par la fonction de scale finale (`computeGalaxyVisualRadius`), qui ne reprend pas la protection silhouette `3.05`.

## Hidden legacy report

### Recherche de double pipeline actif
Commande:

```bash
rg -n "map-profile-to-procedural-uniforms|generate-planet-identity|planet-identity.constants|planet-visual.constants|terrain-worker-client|applyPlanetRenderLod|PlanetVisualProfile|legacy|compat|fallback" src tests app
```

Résultat: pas de référence active à l'ancien pipeline planète supprimé.

### Points notables
- `generate-galaxy-layout.ts` contient encore un mécanisme de *fallback* pour le placement spatial. Ce fallback concerne la distribution de layout galaxie, pas la génération/rendu planète.

## View consistency report

### Vérification de la source canonique partagée
- `buildGalaxyPlanetManifest` construit `planet: CanonicalPlanet` pour chaque entrée.
- `resolvePlanetIdentity` retourne `planet: CanonicalPlanet` directement depuis ce manifest.
- `GalaxyView` rend `planet.planet` depuis le manifest.
- `PlanetView` rend `resolved.planet` depuis le même resolver.

Conclusion: Galaxy/Planet consomment la même source canonique sans régénération parallèle côté vue.

## Scale verification report

Commande d'audit (400 seeds):

```bash
node --import tsx -e "..."
```

Résumé:
- min physicalRadius: `1956.1207` (`radiusClass=dwarf`)
- max physicalRadius: `13995.2830` (`radiusClass=giant`)
- min renderRadiusBase: `2.8139`
- max renderRadiusBase: `5.7988`
- `tooSmall` (galaxyVisualRadius < 3.05): `44 / 400`
- `tooBig` (galaxyVisualRadius > 5.8): `0 / 400`

Exemples:
1. `audit-302` (dwarf, extrême bas)
   - physicalRadius: 1956.1207
   - renderRadiusBase: 2.8139
   - normalizedRadius: 0.0046
   - galaxy visual radius final: 2.8139
   - planet view scale final: 1
2. `audit-252` (dwarf)
   - physicalRadius: 1969.5269
   - renderRadiusBase: 2.8172
   - normalizedRadius: 0.0057
   - galaxy visual radius final: 2.8172
   - planet view scale final: 1
3. `audit-81` (giant)
   - physicalRadius: 13955.3195
   - renderRadiusBase: 5.7889
   - normalizedRadius: 0.9963
   - galaxy visual radius final: 5.7889
   - planet view scale final: 1
4. `audit-156` (giant, extrême haut)
   - physicalRadius: 13995.2830
   - renderRadiusBase: 5.7988
   - normalizedRadius: 0.9996
   - galaxy visual radius final: 5.7988
   - planet view scale final: 1

### Analyse
- Le bug "planètes ridiculement minuscules" est fortement réduit vs ancien pipeline.
- Mais la contrainte de lisibilité mini (3.05) n'est pas strictement appliquée dans la fonction finale de scale Galaxy View.
- Risque restant: quelques naines restent visuellement petites en vue galaxie.

## Render-layer independence report

- Surface/clouds/atmosphere/rings sont créées dans des fonctions distinctes.
- Les toggles debug (`surfaceOnly`, `cloudsOnly`, `atmosphereOnly`, `ringsOnly`) pilotent `shouldRenderLayer`.
- Le couplage restant est faible: les couches partagent uniquement `planet.render` comme source de données (attendu), sans logique legacy croisée.

## Tests coverage review

Tests existants utiles:
- déterminisme canonique
- borne des rayons centralisés
- cohérence manifest/résolution
- séparation view strategy
- présence des couches de rendu

Limites actuelles de couverture:
- aucun test explicite sur seuil lisibilité `>= 3.05` au niveau `computeGalaxyVisualRadius`
- pas de test d'intégration qui compare visuellement/topologiquement Galaxy View vs Planet View pour une même planète
- pas de test automatisé sur toggles debug (activation exclusive des couches)

## Final assessment

- **GO conditionnel** pour architecture (source canonique, déterminisme, suppression legacy active, séparation des couches).
- **NO-GO strict** si l'exigence produit impose une lisibilité minimale absolue en Galaxy View à `>= 3.05` sans exception.

Recommandation minimale avant GO final strict:
- aligner `computeGalaxyVisualRadius` sur `silhouetteProtectedRadius` (ou clamp mini 3.05), puis ajouter un test de non-régression dédié.

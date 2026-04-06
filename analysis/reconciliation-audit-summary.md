# Audit de réconciliation — diversité technique vs lisibilité Galaxy View

## Verdict
**Option B** : le système produit une vraie diversité technique/structurelle, **mais la lisibilité perçue en Galaxy View est partielle**.

## Points factuels clés
- Sur 500 planètes générées, l’échantillon central visible sans pan initial ne contient que 8 archétypes (sur 12) dans le cadrage initial de la caméra Galaxy View.
- Les comparaisons d’images (MAD 96x96) montrent une séparation visuelle réelle mais irrégulière :
  - inter-archétypes (représentants visibles) : médiane ~0.089 en crop galaxy
  - inter-archétypes (mêmes planètes en grand) : médiane ~0.071
- Des paires inter-archétypes restent visuellement proches en pratique (ex. lush vs oceanic proches à la fois en features et en image).

## Interprétation
- La diversité paramétrique et structurelle existe.
- La diversité perceptive en vue macro est freinée par la combinaison :
  1) cadrage initial qui n’expose pas toutes les familles,
  2) LOD galaxy qui atténue le micro-relief,
  3) signatures colorimétriques qui se chevauchent selon certains couples d’archétypes.

## Artefacts produits
- Rapport principal : `analysis/reconciliation-report.json`
- Métriques perceptives d’images : `analysis/perceptual-metrics.json`
- Aucun artefact binaire persisté dans le repo (les captures sont traitées en mémoire puis réduites en métriques JSON).

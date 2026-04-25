# Research Feature Gaps

## Purpose of this document
Documenter les écarts vérifiés entre intentions design probables et comportement runtime réel de la feature research.

## Confirmed implemented
- Queue timed research (start/resolve/completion).
- Guards research (prereqs, lab level, ressources, RP, queue busy).
- Persistence + migration legacy IDs + filtrage unknown IDs + dédup completed.
- Unlock gating des unités via `requiredResearch`.
- Gates espionnage/intel (`espionage`, `cryptography`).

## Partially implemented
- `defensePct`: majoritairement agrégé en `cityDefensePct` sans consumer combat global complet prouvé.
- `antiAirDefensePct`: agrégé/surfacé, sans resolver anti-air dédié prouvé.
- `marketEfficiencyPct`: agrégé/surfacé, sans subsystem trade/market runtime complet prouvé.

## Not implemented yet
- Feature système conquest/colonization reliée à la research `conquest`.
- Consumer runtime dédié navigation/logistics attendu potentiellement par `cartography` (non prouvé dans le code actuel).

## Incorrect / questionable mappings
- `cartography`: possible drift entre intention design probable (navigation speed) et bucket runtime actuel (`marketEfficiencyPct`).
- `recovery_logistics`: bucket `marketEfficiencyPct` potentiellement trop étroit vs libellé logistic.

## UI / UX issues
- L'UI expose correctement états/coûts/durée/RP/queue.
- Limite: le rendu d'effet ne distingue pas explicitement les effets agrégés-only des effets avec consumer gameplay complet.

## Persistence / robustness gaps
- Validation structurelle limitée des entrées `researchQueue` (timestamps/shape payload non strictement normalisés).
- Comportement sur payloads fortement malformés insuffisamment testé.

## Documentation gaps
- Nécessité d'un doc par research pour clarifier declared/intended/runtime impact.
- Nécessité d'un statut explicite pour les recherches dépendant de features mères absentes.

## Recommended next steps
### immediate
- Stabiliser le langage documentaire sur `conquest` et les effets agrégés-only.

### short-term
- Clarifier le positionnement design/runtime de `cartography` et `recovery_logistics`.

### later
- Aligner docs research avec l'implémentation future des systèmes conquest/colonization/trade/combat.

# Overview

Coinage est un jeu de stratégie orienté progression économique et militaire, structuré autour d’une navigation **Galaxy → Planet → City**. Le runtime actuel expose déjà une boucle ville jouable (économie, construction, entraînement, recherche), avec des systèmes avancés encore partiels (combat global, colonisation complète).

## Boucle de navigation
- **Galaxy**: scan des planètes et sélection d’une cible.
- **Planet**: inspection locale et contexte de colonisation.
- **City**: gestion détaillée des ressources, bâtiments, files et progression.

## Boucle de progression (runtime)
1. Produire `ore`, `stone`, `iron`.
2. Upgrader les bâtiments économiques (Mine/Quarry/Refinery/Warehouse).
3. Lancer des constructions et entraînements via les files.
4. Débloquer des recherches pour accélérer production, défense et entraînement.
5. Ouvrir l’accès aux branches avancées (space dock, intel, colonisation).

## Implémenté vs planifié
### Implémenté runtime
- Production passive timestampée, stockage, construction, training queue, research queue.
- Prérequis bâtiments/recherche appliqués.
- Politiques locales et système intel/espionnage de base.

### Partiel / en extension
- Combat macro (résolution complète non prouvée).
- Colonisation inter-planètes (base présente, boucle complète partielle).
- Marché global transactionnel (non démontré end-to-end).

## Lire ensuite
- [Beginner Guide](/wiki/getting-started/beginner-guide)
- [Core Loop](/wiki/getting-started/core-loop)
- [Resources](/wiki/resources-economy/resources)

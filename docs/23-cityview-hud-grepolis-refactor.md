# Cityview HUD Grepolis-Structured Refactor (Phase 4)

## Executive summary
Cette passe remplace l’ancien shell top/bottom orienté “dashboard boxes” par un HUD de jeu compact, segmenté en clusters, tout en gardant le runtime Coinage intact (branches, actions, données, wiring). Les branches classified restent rendues normalement en dessous mais sont masquées par un overlay premium non-interactif.

## Skills appliqués
- **stitch-skill**: conservation de la structure shell Stitch (top rail + left rail + main + right), sans import direct des mock pages, avec focus sur la hiérarchie et la compacité HUD.
- **redesign-skill**: refactor incrémental runtime-safe (pas de nouvelle logique métier, pas de suppression des pages branches, pas de backend inventé).
- **taste-skill**: passe densité/alignement/contraste/états pour un rendu plus premium et lisible (clusters, ratio typographique, badges, overlays, overflow rail).

## Grepolis principles retenus (structure, pas skin)
1. Rail supérieur dominant et compact.
2. Groupes fonctionnels explicites: identité, contexte, ressources, queue, mode-switch.
3. Contexte central mis en avant via un anchor panel.
4. Ressources en format dense HUD (lecture immédiate).
5. Contrôles Galaxy/Planet/City intégrés comme contrôle de navigation de jeu.
6. Suppression de la duplication d’information en bas quand l’info utile est en haut.

## Top HUD changes
- Refactor du `renderTopBar` en 5 clusters:
  1) branding/context léger,
  2) context anchor de branche active,
  3) strip ressources compact + population/storage,
  4) module **Construction queue** compact,
  5) mode switch Galaxy/Planet/City.
- Déplacement de la Construction Queue depuis le bottom strip vers le top HUD.
- État idle compact si queue vide; sinon building courant + timer + progress + densité queue.

## Bottom HUD removal
- Suppression complète du bottom strip runtime.
- Suppression des blocs “Operations” et “Runtime status”.
- Reprise de l’espace vertical pour le main content et le right panel (bottom offset ramené à 0).

## Classified overlay changes
- Branches classified conservées: governance, intelligence, research, market.
- Overlay premium amélioré: voile sombre + pattern subtil + blur + card de framing.
- Copy overlay simplifiée et plus premium:
  - `CLASSIFIED`
  - `DOSSIER SEALED`
  - `GAMEPLAY LOOP NOT YET ONLINE`
- Interactions sous overlay désactivées (main/right), contenu réel conservé dessous.
- Badge classified nav gauche gardé et mieux intégré.

## Nav / Market visibility
- `Market` reste dans `LOCAL_SECTIONS` et donc dans l’ordre runtime réel.
- Rail gauche rendu scrollable pour garantir la visibilité des entrées en hauteur contrainte.

## Fichiers modifiés
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.test.ts`
- `docs/23-cityview-hud-grepolis-refactor.md`

## Compromis restants
- Le right panel est conservé tel quel côté logique métier; seule la présentation shell/HUD est refactorée.
- Le wording métier des pages n’a pas été remanié au-delà de l’overlay classified.

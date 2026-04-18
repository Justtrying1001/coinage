# Cityview HUD + Classified Structural Refactor (Grepolis-informed, runtime-safe)

## Executive summary
Cette passe corrige le city HUD de manière structurelle: top bar unifiée en rail continu, queue de construction intégrée en haut, suppression du bas inutile, et overlay Classified refait pour un rendu plus premium et sobre sans blur sale.

## Skill usage report
Pré-travail effectué sur les skills extraits de `skill/taste-skill-main.zip`:
- `stitch-skill`: utilisé pour cadrer la fidélité de structure shell (top rail / left rail / main / right) et éviter les dérives “dashboard générique”.
- `redesign-skill`: refactor incrémental sans rupture runtime (pas de backend ajouté, pas de changement de logique métier, pas d’import de mock page complète).
- `taste-skill`: passe de densité et hiérarchie visuelle (compacité, alignements, ratios typo, segmentation, états, overflow).

## Grepolis HUD analysis (structure)
1. **Barre continue**: le HUD est perçu comme un seul shell, pas comme des cartes indépendantes.
2. **Lecture gauche → centre → droite**: identité/contexte macro, ancrage central fort, ressources/activité, puis actions/navigation.
3. **Center anchor**: plaque centrale qui fixe le contexte local et stabilise la lecture.
4. **Densité horizontale**: beaucoup d’info utile sur faible hauteur, sans pavés hauts.
5. **Compteurs rapides**: formats courts, tabulaires, répétables, scan visuel immédiat.
6. **Intégration des contrôles**: les boutons de nav font partie du rail HUD, pas un bloc séparé.
7. **Activité visible sans dominer**: la queue doit être lisible mais compacte.

## Mapping: what we keep from Grepolis vs what we do NOT import
### Repris (architecture)
- rail HUD continu
- hiérarchie gauche/centre/droite
- ancrage contextuel central
- densité compacte
- intégration nav dans le rail

### Non importé (interdit)
- skin fantasy/médiéval
- wording métier Grepolis
- systèmes gameplay non présents dans Coinage
- mock pages importées comme vérité produit

## Coinage HUD mismatch audit (before fix)
- top bar encore perçue comme “suite de boîtes”
- segmentation pas assez unifiée
- center anchor pas assez structurant
- queue top encore un peu “module isolé”
- overlay classified trop blur/pattern envahissant

## Detailed implementation changes
### A) Top HUD refactor
- top bar convertie en **rail unifié**: `city-stitch__hud-frame` + segments internes (brand/context/resources/queue/controls).
- segments reliés par séparateurs internes au lieu de “cards flottantes”.
- center anchor renforcé (plaques corners + contraste local).
- ressources compactées avec métriques tabulaires.
- mode-switch `Galaxy / Planet / City` intégré au même rail.

### B) Construction queue migration/fit
- queue gardée en top via `createTopQueueModule()`.
- état idle compact quand vide, sinon entrée active + progression + ratio de queue.

### C) Bottom removal and layout reclaim
- bottom strip runtime déjà retiré: aucune barre basse résiduelle.
- offsets layout consolidés (`bottom: 0`) pour reprendre l’espace contenu.

### D) Classified overlay rebuild
- suppression du blur agressif.
- nouveau veil sombre premium + trame diagonale très légère.
- contenu dessous assombri/désaturé sans effet “brouillard”.
- overlay principal avec panneau “CLASSIFIED / ACCESS WITHHELD”.
- right panel: version “chip” compacte (`CLASSIFIED · TACTICAL FILE SEALED`) pour éviter la duplication lourde.
- interactions sous overlay conservées neutralisées.

## Files modified
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.test.ts`
- `docs/24-cityview-hud-classified-structural-refactor.md`

## Commands executed
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Validation results
- typecheck: pass
- test: pass
- build: pass

## Remaining compromises
- le right panel garde sa structure métier actuelle (pas de refonte fonctionnelle), seule la couche shell visuelle/classified est ajustée.

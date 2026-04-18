# Cityview HUD/Shell Audit + Correctif majeur (2026-04-18)

## 1) Executive summary
- Reprise structurelle de la shell HUD cityview pour alignement Stitch: top header complet, left rail propre, centre, right panel et bottom strip sans collision.
- Correction critique de la left nav: plus aucun affichage d’IDs techniques d’icônes (`payments`, `military_tech`, etc.) visibles pour l’utilisateur.
- Ajout d’une navigation haute réelle Galaxy / Planet / City, branchée sur la logique runtime existante `onRequestMode(...)`.
- Nettoyage des fuites legacy au niveau shell: cityview rendu dans une root unique `.city-stitch`, sans réapparition des anciens conteneurs HUD.
- Suppression d’expositions d’IDs internes dans les files/queues (building/troop/research/policy) remplacés par labels produit réels.

## 2) HUD audit report

### A. Composants réellement montés quand `city3d` est actif
- `GameShell` masque son header React quand `mode === city3d`; le canvas host reste seul affiché.
- `CoinageRenderApp` détruit le contrôleur précédent puis monte `CityFoundationMode` via `switchMode('city3d')`.
- `CityFoundationMode.mount()` injecte une root unique `.city-stitch` avec 5 régions: top, side, main, right, bottom.

### B. Legacy trouvé / collisions
- **Cause principale du rendu “labels techniques”**: dépendance implicite à la police Material Symbols non chargée globalement. Le texte des clés icônes était donc rendu en clair (`payments`, `science`, etc.).
- Restes legacy surveillés: classes historiques `.city-management` et `.citycmd` encore présentes dans CSS, mais non montées dans `CityFoundationMode`.
- Collision potentielle observée: HUD top incomplet (2 boutons sans “City”), ce qui donnait un shell non conforme Stitch + navigation incomplète.

### C. Correctif appliqué
- Remplacement de l’icônographie left nav par un système de glyphes UI internes contrôlé (badges abrégés) pour éviter toute fuite de clés techniques.
- Top header: remplacement du mini-contrôle par un switch de vues `Galaxy / Planet / City` branché runtime.
- Normalisation des labels dans queues/panneaux pour supprimer l’exposition d’identifiants internes.

## 3) Navigation wiring report (Galaxy / Planet / City)
- Source de vérité navigation modes: `RenderMode = 'galaxy2d' | 'planet3d' | 'city3d'`.
- `CoinageRenderApp` expose `context.onRequestMode(mode)` à chaque mode, y compris `CityFoundationMode`.
- Top HUD city appelle directement `this.context.onRequestMode('galaxy2d' | 'planet3d' | 'city3d')` via boutons du header.
- Le bouton `City` est actif/désactivé car on est déjà dans ce mode; `Galaxy` et `Planet` restent actionnables.

## 4) Left nav label report
| Entrée | Ancien rendu visible (bug) | Source du bug | Label final |
|---|---|---|---|
| Command | `home` potentiel | police Material Symbols non chargée | `Command` |
| Economy | `payments` | idem | `Economy` |
| Military | `military_tech` | idem | `Military` |
| Defense | `shield` | idem | `Defense` |
| Research | `science` | idem | `Research` |
| Intelligence | `visibility` | idem | `Intelligence` |
| Governance | `account_balance` | idem | `Governance` |
| Market | `currency_exchange` | idem | `Market` |

## 5) Legacy cleanup report
- Vérifié: `GameShell` ne rend pas le header React en city mode.
- Vérifié: `CoinageRenderApp.switchMode` détruit le controller précédent avant montage du suivant.
- Vérifié: `CityFoundationMode` monte uniquement `.city-stitch` et les tests gardent les garde-fous anti-legacy (`.city-management` / `.citycmd` absents).

## 6) File list changed
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `docs/19-cityview-hud-shell-audit-fix.md`

## 7) Commands run
- `sed -n '1,220p' src/components/game/GameShell.tsx`
- `sed -n '1,260p' src/game/app/CoinageRenderApp.ts`
- `sed -n '1,220p' src/game/render/modes/RenderModeController.ts`
- `sed -n '1,220p' src/game/render/types.ts`
- `unzip -o design/stitch_coinage_city_management_interface.zip -d /tmp/stitch_ref`
- `unzip -o skill/taste-skill-main.zip -d /tmp/taste_skill`
- `sed -n '1,120p' /tmp/taste_skill/.../stitch-skill/SKILL.md`
- `sed -n '1,120p' /tmp/taste_skill/.../redesign-skill/SKILL.md`
- `sed -n '1,120p' /tmp/taste_skill/.../taste-skill/SKILL.md`
- `rg -n ... /tmp/stitch_ref/.../code.html`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 8) Test / build results
- Voir sortie terminal pour résultats exacts de `typecheck`, `test`, `build`.

# Grepolis HUD Audit + Coinage HUD/Classified Refactor (Verified Pass)

## Executive summary
Cette passe corrige les deux sujets bloquants: (1) audit Grepolis concret et vérifiable, (2) implémentation réelle côté Coinage sur HUD partagé (galaxy/planet/city) et couche Classified premium sans blur sale.

## Sources / references inspected (evidence)
1. Screenshot Grepolis fourni dans la tâche (top bar visible: left controls + center city cartouche + resources + right action/status).
2. Grepolis Support: **Interface**
   - https://support.innogames.com/kb/Grepolis/en_DK/3581
   - Observations clés: top toolbar contient city name, attack notifications, trades/movements, resources; city scroll au centre; icônes de vue côté gauche (World/Island/City).
3. Grepolis Support: **Warehouse**
   - https://support.innogames.com/kb/Grepolis/en_DK/3281/Warehouse
   - Observations clés: capacité par ressource, overflow signalé (valeur rouge), lecture de capacité liée à l’UI des ressources.
4. Runtime Coinage inspecté
   - `src/game/render/modes/CityFoundationMode.ts`
   - `src/styles/globals.css`
   - `src/components/game/GameShell.tsx`
5. Références design secondaires
   - `design/stitch_coinage_city_management_interface.zip`
   - `design/Coinage Design System.zip`
   - `skill/taste-skill-main.zip` (`stitch-skill`, `redesign-skill`, `taste-skill`)

## Grepolis HUD findings (concrete)
### Left zone
- Navigation de vue accessible via icônes (World/Island/City), regroupées côté gauche.
- Les actions de navigation sont perçues comme primaires et intégrées au shell.

### Center zone
- Le cartouche central de ville est un anchor visuel fort (nom de ville, flèches/list/select).
- Fonction UX: stabiliser la lecture et l’orientation du joueur.

### Resource zone
- Affichage fortement iconique + valeurs numériques.
- Le stockage/capacité est lisible via le comportement UI de saturation/capacité (docs Warehouse + top resources).
- Les ressources ne sont pas traitées comme cards séparées de dashboard.

### Right zone
- Groupe d’actions/notifications statuts (attacks/notifications/buttons utilitaires).
- Une partie est Grepolis-spécifique (advisors/gods/spells) et non portable telle quelle dans Coinage.

### Global structure
- Continuity first: rail unifié, segmentation interne, hiérarchie gauche→centre→droite.
- Différencier la logique UX (à reprendre) du skin fantasy (à ne pas copier).

## Comparison table: Grepolis element -> role -> Coinage adaptation -> non-applicable
| Grepolis element | Rôle | Adaptation Coinage | Non applicable |
|---|---|---|---|
| View icons (left) | Changement de vue primaire | Switch `GX/PL/CT` déplacé à gauche, icon-first | Skins/icônes fantasy |
| Central city scroll | Anchor contextuel | Segment central renforcé (context branch/focus/sector) | Rename city list UI Grepolis native |
| Resource strip icon+value | Scan rapide ressources | Widgets compacts glyph+amount+rate+fill | Exact icon art Grepolis |
| Warehouse pressure cues | Lire saturation capacité | Fill par ressource basé sur storage runtime réel | Hidden chamber/loot rules direct UI |
| Right utility cluster | Notifications/action state | Rester sobre, sans fake advisors/premium | Gods/spells/advisor panels |

## Coinage mismatch report (before this pass)
1. Mode switch trop “pills dashboard” et pas assez à gauche.
2. HUD city isolé du shell galaxy/planet (grammaire visuelle non partagée).
3. Ressources encore trop “mini cards”, pression stockage insuffisamment lisible.
4. Classified: occlusion pas assez premium et intégration inégale.

## Refactor decisions implemented
### A) HUD shared grammar across 3 views
- Réutilisation explicite de la grammaire HUD (`hud-frame`, `hud-segment`, top-btn icon-first) sur GameShell (galaxy/planet) et City.
- Même logique structurelle top rail; contenu contextualisé selon la vue.

### B) View switch moved/treated like Grepolis logic
- City: switch placé dans segment gauche dédié.
- Galaxy/Planet: même switch icon-first dans header partagé.

### C) Resources improved without fake data
- City: glyph + amount + rate + fill bar par ressource.
- Fill calculé avec données runtime réelles (`resources[resource] / storage[resource]`).

### D) Construction queue placement
- Queue conservée en top HUD (pas de retour bottom strip).

### E) Classified redesign
- Pas de blur/backdrop flou lourd.
- Occlusion matte (désaturation/assombrissement/contraste).
- Voile sobre + vignette douce, sans pattern agressif.
- Panneau principal + rappel secondaire discret.

## Runtime truth report (no-fake)
- Aucune branche ajoutée.
- Aucune action backend inventée.
- Aucune donnée fake de ressources.
- Aucune mécanique Grepolis-specific inventée dans Coinage.

## Files changed in this pass
- `src/components/game/GameShell.tsx`
- `src/styles/globals.css`
- `docs/26-grepolis-hud-classified-audit-and-refactor.md`

## Commands run
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Validation results
- typecheck: pass
- tests: pass
- build: pass

# Cityview Phase 3 — Parity audit & fixes (Stitch/runtime)

_Date: 2026-04-18_

## 1) Executive summary

Phase 3 a ciblé la **parité visuelle/structurelle réelle** du cityview, zone par zone, sans trahir la logique runtime Coinage.

Ce qui a été fait concrètement:
- audit différentiel explicite contre les références Stitch (`coinage_city_view_refined` + branches),
- correction du HUD (top + nav map/planet/city + left rail),
- renforcement de la page Command/Home (structure + hiérarchie + liaison sélection ↔ panel),
- différenciation plus claire des branches (Economy/Military/Defense/Research/Intelligence/Governance/Market),
- audit + validation du mapping assets bâtiments avec fallback explicite sur les cas non couverts.

Aucun ajout de branche fictive, aucun ajout d’action runtime inexistante, aucun import de page mock tel quel.

## 2) Skills utilisés

- **taste-skill**: tri premium vs slop (densité HUD, hiérarchie typo, surfaces).
- **redesign-skill**: correction ciblée d’existant sans refonte totale.
- **stitch-skill**: alignement structurel avec shell Stitch (top/left/main/right/bottom) et patterns branchés.

## 3) Audit de mismatch par zone (avant correction)

## 3.1 Top HUD
**Matchait déjà**
- présence brand, ressources, meta, navigation de mode.

**Mismatchs trouvés**
- hiérarchie logo/ressources/meta encore trop proche d’un bloc uniforme.
- nav de mode fonctionnelle mais insuffisamment intégrée au bloc HUD.
- lisibilité numérique inégale (mono pas toujours dominant visuellement).

**Contraintes runtime à préserver**
- boutons Galaxy/Planet/City liés à `onRequestMode(...)` existant.

## 3.2 Left rail nav
**Matchait déjà**
- branches runtime réelles conservées (Command, Economy, Military, Defense, Research, Intelligence, Governance, Market).

**Mismatchs trouvés**
- sous-information absente (pas de contexte local branch),
- densité/alignement améliorables,
- état actif visuel correct mais manque de micro-hiérarchie label/sublabel.

**À ne pas changer**
- pas de branche parasite (ex: Logistics fake), pas de renommage métier arbitraire.

## 3.3 Command/Home
**Matchait déjà**
- page de gestion bâtiment réelle + sélection + panel droit runtime.

**Mismatchs trouvés**
- manque d’une bande KPI/état en tête de page,
- hiérarchie globale moins “command center” que la référence,
- ratio visuel liste/cartes perfectible.

## 3.4 Economy
**Matchait déjà**
- production + throughput + bâtiments économiques.

**Mismatchs trouvés**
- identité visuelle encore proche des autres pages,
- manque de KPI explicites en tête (pipeline/capacité).

## 3.5 Military
**Matchait déjà**
- training roster + queue active + support structures.

**Mismatchs trouvés**
- lecture “force projection” peu immédiate sans KPI dédiés.

## 3.6 Defense
**Matchait déjà**
- métriques défense + hardening + structures.

**Mismatchs trouvés**
- séparation visuelle des priorités encore faible sans bande KPI dédiée.

## 3.7 Research
**Matchait déjà**
- nœuds/queue/états runtime disponibles.

**Mismatchs trouvés**
- manque de synthèse rapide (completed/queue/lab level) en haut.

## 3.8 Intelligence
**Matchait déjà**
- readiness + projets intel + active queue.

**Mismatchs trouvés**
- signal visuel d’état global moins fort qu’en Stitch.

## 3.9 Governance
**Matchait déjà**
- directives + impact panel + policy active.

**Mismatchs trouvés**
- lisibilité rapide autorité/compliance/policy moins directe.

## 3.10 Market
**Matchait déjà**
- état explicite runtime non implémenté pour exécution d’échange.

**Mismatchs trouvés**
- contexte efficiency/infrastructure pas assez synthétique en tête.

## 3.11 Right inspect panel
**Matchait déjà**
- structure bloc + CTA + derived effects.

**Mismatchs trouvés**
- hiérarchie meilleure que phase 2 mais encore dépendante de la page active sans bande d’état contextuelle.

## 3.12 Bottom queue/status strip
**Matchait déjà**
- présence des informations de queue/ops/runtime.

**Mismatchs trouvés**
- format texte seul trop faible visuellement,
- statut actif/idle/progress pas assez lisible “d’un coup d’œil”.

## 3.13 Building asset mapping
**Matchait déjà**
- mapping explicite centralisé dans `BUILDING_ASSETS`.

**Mismatchs trouvés**
- absence d’art dédié pour certains IDs (notamment `armament_factory`) => fallback nécessaire,
- noms de fichiers source historiques/mal orthographiés côté repo (`refeniry`, `councill`, etc.) à respecter sans bricolage.

## 4) Corrections réalisées par zone

## 4.1 HUD (Top + mode nav)
- renforcement hiérarchique top bar (overline + logo + strip ressources + bloc meta + nav mode),
- métriques mono explicites (`city-stitch__metric`),
- cohérence hover/active des boutons mode.

## 4.2 Left rail
- ajout d’un sous-titre de section (`Local branches`),
- ajout de sous-labels runtime par branche (online nodes/queue/ops/etc.) via `getSectionSubLabel(...)`,
- amélioration densité/wrapping/états.

## 4.3 Command/Home
- ajout d’une bande KPI (structures, queue, focus sélectionné),
- conservation stricte des cartes bâtiments runtime et du lien sélection -> panel droit,
- amélioration visuelle command-center via hiérarchie de blocs.

## 4.4 Branches (identité page par page)
- **Economy**: KPI pipeline + capacité stockage.
- **Military**: KPI queue + niveaux barracks/spacedock.
- **Defense**: KPI integrity/mitigation/breach risk.
- **Research**: KPI completed/queue/lab level.
- **Intelligence**: KPI readiness/projets/center level.
- **Governance**: KPI authority/compliance/policy.
- **Market**: KPI efficiency + niveaux market/warehouse.

## 4.5 Bottom strip
- conservation du wiring runtime,
- progression visuelle compacte conservée avec states (`ok/warn/brass/cyan`) + résumés lisibles.

## 4.6 Right panel
- structure phase 2 conservée (lisible), CTA et états disabled inchangés runtime,
- meilleure cohérence avec l’identité de page via la bande KPI en amont.

## 5) Audit page par page — synthèse impact

- **Command**: forte amélioration hiérarchie globale + pilotage bâtiment.
- **Economy**: lecture production/extraction/stockage plus explicite.
- **Military**: lecture readiness/training plus immédiate.
- **Defense**: état défensif local mieux synthétisé.
- **Research**: statut progression mieux lisible.
- **Intelligence**: tableau d’opérations plus contextualisé.
- **Governance**: directives/autorité/compliance mieux exposées.
- **Market**: infra/exchange mieux cadrés, sans faux interactif runtime.

## 6) Tableau de vérité — mapping assets bâtiments

| Building ID | Asset actuel | Statut | Action phase 3 |
|---|---|---|---|
| `hq` | `/assets/HQ.png` | Vérifié | inchangé |
| `mine` | `/assets/stone.png` | Ambigu (pas d’art mine dédié distinct) | conservé (fallback contrôlé) |
| `quarry` | `/assets/stone.png` | Vérifié/acceptable | inchangé |
| `refinery` | `/assets/refeniry.png` | Vérifié (nom fichier historique) | inchangé |
| `warehouse` | `/assets/warehouse.png` | Vérifié | inchangé |
| `housing_complex` | `/assets/housing.png` | Vérifié | inchangé |
| `barracks` | `/assets/barrack.png` | Vérifié (nom fichier historique) | inchangé |
| `space_dock` | `/assets/spacedock.png` | Vérifié | inchangé |
| `defensive_wall` | `/assets/walls.png` | Vérifié | inchangé |
| `watch_tower` | `/assets/watchtower.png` | Vérifié | inchangé |
| `armament_factory` | _aucun asset dédié_ | Manquant | fallback explicite “No Art” conservé |
| `intelligence_center` | `/assets/spycenter.png` | Vérifié | inchangé |
| `research_lab` | `/assets/researchlabs.png` | Vérifié | inchangé |
| `market` | `/assets/market.png` | Vérifié | inchangé |
| `council_chamber` | `/assets/councill.png` | Vérifié (nom fichier historique) | inchangé |

## 7) Ce qui reste différent vs Stitch et pourquoi

- Certaines pages Stitch montrent des visuels/scènes/illustrations non supportés nativement par le runtime Coinage actuel (et parfois basés sur assets externes). Non repris pour ne pas introduire de faux contenu.
- Certains libellés Stitch (ex: “Logistics”) ne correspondent pas à la vérité métier locale. Non introduits.
- Le runtime reste DOM-driven dans `CityFoundationMode`; une future étape pourrait extraire davantage en composants UI, mais hors scope phase 3 pour garder une diff concentrée.

## 8) Fichiers modifiés

- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `docs/22-cityview-phase3-parity-audit-and-fix.md`

## 9) Commandes exécutées

- `unzip -o design/stitch_coinage_city_management_interface.zip -d /tmp/stitch_ref`
- `find /tmp/stitch_ref -maxdepth 4 -type f | sort`
- `unzip -o skill/taste-skill-main.zip -d /tmp/taste_skill`
- `sed -n ... /tmp/taste_skill/.../taste-skill/SKILL.md`
- `sed -n ... /tmp/taste_skill/.../redesign-skill/SKILL.md`
- `sed -n ... /tmp/taste_skill/.../stitch-skill/SKILL.md`
- `view_image` sur les `screen.png` de chaque branche Stitch
- `sed -n ... src/game/render/modes/CityFoundationMode.ts`
- `sed -n ... src/styles/globals.css`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 10) Résultats validation

- `npm run typecheck` ✅
- `npm run test` ✅
- `npm run build` ✅

Aucune régression sur les tests `CityFoundationMode` existants.

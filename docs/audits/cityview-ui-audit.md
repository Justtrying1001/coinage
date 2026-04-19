# Cityview UI Audit (Code-grounded)

## 1) Executive summary

La cityview exposait déjà une partie conséquente du runtime (construction, entraînement, recherche, intel, politiques), mais la compréhension joueur était fortement dégradée par quatre points majeurs:

1. **Overlay “Classified” masquant des systèmes jouables** (Research / Intelligence / Governance), ce qui cachait de l’information décisionnelle réelle.
2. **Panneau détail non contextuel et trop pauvre** (ex: Military affichait “Selected unit” sans stats ni prérequis précis).
3. **États d’action insuffisamment explicités** (disponible/locked/max/queue full/missing research, etc. peu distingués visuellement).
4. **Market UI trompeuse** (labels “Live / Select in UI / Authorization blocked”) alors que le flow de trade n’est pas implémenté.
5. **Asset routing fragile**: plusieurs images bâtiment ne se chargeaient plus car la route `/assets/[file]` cherchait uniquement `assets/<file>` alors que les fichiers sont sous `assets/building/`.

Les corrections implémentées dans ce lot rendent la vérité runtime plus lisible: état de branche, état de carte, raisons de blocage, détail contextuel par sélection, et messaging honnête sur les systèmes partiels.

---

## 2) Architecture actuelle de la cityview

- Entrée page game: `src/app/game/page.tsx` → `GameShell`.
- `GameShell` gère mode Galaxy/Planet/City et délègue au viewport.
- `GameRenderViewport` instancie `CoinageRenderApp` et bascule les modes.
- La cityview est rendue par `CityFoundationMode` (DOM impératif), avec:
  - top HUD (`renderTopBar`)
  - side nav (`renderSideNav`)
  - main canvas sectionnel (`renderMainCanvas`)
  - detail panel (`renderDetailPanel`)
- La source runtime de progression/guards est `cityEconomySystem.ts`, et la persistance est `cityEconomyPersistence.ts`.

---

## 3) Problèmes UX/UI par gravité

### Critical
- **Masquage d’information actionable via overlay classified** alors que les branches sont jouables en runtime.
- **Market présenté comme interactif “live” sans trade runtime effectif** (fake affordance).

### High
- **Detail panel non aligné avec la sélection réelle** (unité/recherche/policy/projet).
- **États disabled non normalisés ni clairement distingués** (max/locked/unavailable/queue full).

### Medium
- **HUD incomplet sur l’état opérationnel global** (queues, alertes de saturation/pop cap).
- **Wording parfois décoratif plutôt que décisionnel**.

### Low
- **Incohérences terminologiques mineures** (Academy vs Research Lab).
- **Certaines infos runtime disponibles non surfacées** (stats unit, effets policy/research).

---

## 4) Audit section par section

## Command
- Attendu joueur: voir progression bâtiment + décider upgrades.
- Runtime sait: niveau, coût, prérequis, durée, effets, guard précis.
- UI avant: carte + coût + raison courte.
- Gap: peu de visibilité sur effet courant vs prochain, prérequis complets.
- Correction: états normalisés, résumé unlock, effets courant/prochain dans détail.

## Economy
- Attendu: comprendre production/stockage/saturation/pop.
- Runtime sait: prod/h, caps, pop snapshot, malus milice.
- UI avant: partiellement visible.
- Gap: manque d’alertes claires et résumé queue global.
- Correction: HUD enrichi (queues, alertes), wording plus explicite.

## Military
- Attendu: comparer unités et comprendre blocages.
- Runtime sait: coûts, temps, stats complètes, prérequis bâtiment/recherche, owned/queued.
- UI avant: rows minimales + détail placeholder.
- Gap: décisions impossibles sans stats/pre-req visibles.
- Correction: cartes unités enrichies + sélection + panneau détail contextuel.

## Defense
- Attendu: comprendre posture défensive.
- Runtime sait: dérivés defense/mitigation/siege/AA.
- UI avant: déjà partiellement bon.
- Gap: lien avec autres systèmes peu explicité.
- Correction: inchangé fonctionnellement, mais cohérence globale renforcée via detail/derived.

## Research
- Attendu: choisir recherches, comprendre coût/effet/blocages.
- Runtime sait: cost, RP cost, lab level gate, completed, guard.
- UI avant: cards basiques.
- Gap: effet réel trop peu visible, détail non contextuel.
- Correction: effet affiché, état explicite, sélection + détail spécifique.

## Intelligence
- Attendu: readiness, projets, vault, contraintes mission.
- Runtime sait: durée projet, readiness gain, vault cap, in-flight, guards.
- UI avant: partiellement correct mais trop synthétique.
- Gap: compréhension des projets et contraintes mission perfectible.
- Correction: cartes projet avec durée/gain, détail enrichi vault/in-flight, wording clarifié.

## Governance
- Attendu: comprendre policy effects et prérequis.
- Runtime sait: effets numériques, required council level, active policy.
- UI avant: description textuelle uniquement.
- Gap: impacts insuffisamment calculables par le joueur.
- Correction: effets chiffrés rendus visibles + détail contextualisé.

## Market
- Attendu: savoir ce qui est jouable ou non.
- Runtime sait: marketEfficiency dérivée; pas de transaction trade branchée.
- UI avant: affordances trompeuses “Live / select / confirm trade”.
- Correction: panneau honnête “not implemented” + suppression du faux flow.

---

## 5) Audit du detail panel

Avant:
- Faible contextualisation multi-sections.
- Military/Research/Governance souvent “overview” non orienté décision.

Après:
- Contextualisation par sélection (building/unit/research/policy/intel project).
- Affichage coûts/effets/prérequis/raisons de blocage quand disponibles.

---

## 6) Audit des états bloqués / disabled / locked

Avant:
- Labels hétérogènes et peu distincts.

Après:
- État normalisé côté building card via helper (`AVAILABLE`, `LOCKED`, `MAX LEVEL`, raisons guard).
- Boutons reprennent raison runtime quand non disponible.

---

## 7) Audit placeholders / fake affordances / wording trompeur

- Retrait de l’effet “Classified” masquant des branches jouables.
- Refonte textuelle Market pour signaler explicitement le scope réellement implémenté.
- Remplacement de libellés vagues par des formulations actionnables (ex: “Start research”, “Blocked: ...”).
- Uniformisation des textes visibles en anglais pour éviter les mélanges de langue en UI.

---

## 8) Cohérence avec docs building/units

Vérifications principales:
- Market: docs indiquent impact limité à `marketEfficiencyPct` (pas de transaction runtime) — désormais reflété en UI.
- Units naval/ground: stats et prérequis existent en config/runtime, maintenant exposés dans Military.
- Research: gating lab+RP + coûts runtime reflétés.

---

## 9) Plan de correction priorisé

1. **Done** — supprimer masquage classified sur branches jouables.
2. **Done** — rendre le detail panel contextuel et décisionnel.
3. **Done** — rendre Market honest-by-design.
4. **Done** — améliorer lisibilité états/guards.
5. **Done** — enrichir Military/Research/Governance avec data runtime.
6. **Done (partiel)** — HUD avec alertes/queues globales.

---

## 10) Gaps runtime non corrigeables frontend seul

- Pas de moteur de transaction de marché (buy/sell/conversion) exploitable.
- Pas de résolution de combat complète pour stats unit (au-delà entraînement/stockage).
- Pas de queue de recherche progressive (recherche instantanée à l’achat).
- Certains effets config existent mais n’ont pas de boucle gameplay visible dans ce runtime local.
- La route assets ne gère pas nativement les chemins hiérarchiques (fix frontend appliqué pour lookup building/troups, mais architecture à consolider côté asset pipeline).

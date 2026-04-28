# Coinage MVP Tracker

## 1. Vue d’ensemble
La branche **ÉCONOMIE / MVP** est largement resynchronisée sur le runtime actuel pour les scopes déjà traités.

- **Audits traités et intégrés**: `hq`, `mine`, `quarry`, `refinery`, `warehouse`, `housing_complex`, `barracks`, `space_dock`, `defensive_wall`, `skyshield_battery`, `armament_factory`, `research_lab`, `market`, plus les lots `barracks units` et `space_dock units`.
- **Correctifs transverses déjà en place dans le code**: logique population (occupation niveau courant + coût upgrade en delta), suppression de l’ancien champ de butin des unités, canon `transportCapacity`, ajout `navalAttack/navalDefense` pour les unités Space Dock, renommages user-facing et renommage technique `watch_tower` → `skyshield_battery` avec compat legacy persistence.
- **Statut global**: runtime/config/docs des scopes traités = majoritairement stabilisés; la dette ouverte se divise désormais en deux blocs distincts: **(A) audit/implémentation runtime restante** (audits bâtiment + assets), et **(B) features produit MVP majeures** encore à implémenter/vérifier/finaliser (guerre, macro/micro, colonisation, bataille, espionnage, vues UI principales).

- **Note produit figée (anti-doublon)**: `research_lab` = unlock tree / accès systèmes; `armament_factory` = amélioration attaque/défense des unités terrestres et aériennes, sans rôle de research ni production; remplacement `temple/gods` = futur système dédié de généraux (`war_council`/`high_command`) non implémenté à ce jour.

## 2. Travaux déjà validés
| Scope | Type | Status | Verdict | Ce qui a été vérifié | Ce qui a été corrigé | Ce qui reste éventuellement à faire | Références repo/doc |
|---|---|---|---|---|---|---|---|
| hq | Bâtiment | DONE | Validé | progression, coûts, timings, effets, cohérence runtime/docs | resynchronisation doc/runtime confirmée | rien d’ouvert sur ce scope | `docs/building/hq.md` |
| mine | Bâtiment | PARTIAL | Runtime OK, visuel incomplet | production et progression runtime, cohérence économie | comportement runtime confirmé | **asset bâtiment manquant (volontaire/documenté)** | `docs/building/mine.md` |
| quarry | Bâtiment | DONE | Validé | progression, effets, runtime | cohérence doc/runtime confirmée | rien d’ouvert sur ce scope | `docs/building/quarry.md` |
| refinery | Bâtiment | DONE | Validé | progression, effets, runtime | cohérence doc/runtime confirmée | rien d’ouvert sur ce scope | `docs/building/refinery.md` |
| warehouse | Bâtiment | DONE | Validé | storage caps, progression, runtime | cohérence storage/runtime confirmée | rien d’ouvert sur ce scope | `docs/building/warehouse.md` |
| housing_complex | Bâtiment | DONE | Validé | capacité population, progression, runtime | cohérence doc/runtime confirmée | rien d’ouvert sur ce scope | `docs/building/housing_complex.md` |
| barracks | Bâtiment | DONE | Validé | progression, effets training, runtime | cohérence doc/runtime confirmée | rien d’ouvert sur ce scope | `docs/building/barracks.md` |
| space_dock | Bâtiment | DONE | Validé | progression Harbor-like et invariants de courbe | anomalies **L7** et **L27** corrigées et stabilisées | rien d’ouvert sur ce scope traité | `docs/building/space_dock.md`, `src/game/city/economy/cityBuildingLevelTables.ts` |
| defensive_wall | Bâtiment custom Coinage | DONE | Validé (défense sol) | prérequis, progression, effets runtime ciblés | modèle orienté **défense sol**: `groundWallDefensePct`/`groundWallBaseDefense`; application en **city_defense** uniquement; ciblage unités **Barracks**; prérequis aligné `barracks >= 3` | équilibrage combat à surveiller lors du branchement combat final | `docs/building/defensive_wall.md`, `src/game/city/economy/cityContentCatalog.ts` |
| skyshield_battery | Bâtiment custom Coinage | DONE | Validé (anti-aérien) | prérequis, progression, effets runtime ciblés | remplacement technique complet de `watch_tower`; modèle anti-aérien `airWallDefensePct`/`airWallBaseDefense`; application en **city_defense** uniquement; ciblage unités **space_dock**; aucun bonus offensif/Barracks; migration legacy save `watch_tower` | équilibrage combat à surveiller lors du branchement combat final | `docs/building/skyshield_battery.md`, `src/game/city/economy/cityContentCatalog.ts`, `src/game/city/economy/cityEconomyPersistence.ts` |
| armament_factory | Bâtiment | PARTIAL | Rôle figé sur 4 axes combat | identité, prereqs (`HQ8`, `research_lab10`, `barracks10`), table 1..35, palier final L35 all-units, séparation vs training/research/production | runtime+catalog+docs alignés sur `groundAttackPct`/`groundDefensePct`/`airAttackPct`/`airDefensePct`, sans `trainingSpeedPct` | consommation combat finale détaillée encore partielle | `docs/building/armament_factory.md`, `src/game/city/economy/cityEconomySystem.ts`, `src/game/city/economy/cityBuildingLevelTables.ts` |
| research_lab | Bâtiment | DONE | Scope verrouillé runtime+catalog+docs | identité (`HQ8`, `housing_complex6`, `barracks5`), max level 35, effet unique `researchCapacity=4/level`, système research temporisé (1 slot actif), prérequis de recherches + guards RP/ressources | matrice research resynchronisée sur les sources runtime (`CITY_ECONOMY_CONFIG.research`, `troops.requiredResearch`, guards intel), docs strictes sans extrapolation, tests resynchronisés | dette ouverte hors-scope: équilibrage macro final (guerre/colonisation) | `docs/building/research_lab.md`, `docs/research/research_matrix.md`, `src/game/city/economy/cityEconomySystem.ts`, `src/game/city/economy/cityEconomyConfig.ts`, `src/game/city/economy/cityEconomySystem.test.ts` |
| market | Bâtiment | PARTIAL | Rôle principal réaligné sur transfert ressources | identité (`HQ3`, `warehouse5`), max level 30, table 1..30, effet principal `shipmentCapacity`, UI market alignée capacité/guards | runtime ajouté (`getMarketShipmentCapacity`, `canSendResourceTransfer`, `sendResourceTransfer`), catalog + tests + docs resynchronisés | livraison inter-ville/settlement complet encore non implémenté (TODO MVP trading global) | `docs/building/market.md`, `src/game/city/economy/cityEconomySystem.ts`, `src/game/city/economy/cityBuildingLevelTables.ts`, `src/game/render/modes/CityFoundationMode.ts`, `src/game/city/economy/cityContentCatalog.ts` |
| intelligence_center | Bâtiment | DONE | Espionnage MVP finalisé | identité/prérequis/table 1..10, vault, mission ville->ville, résolution cross-city, rapports attaquant/défenseur, snapshot succès, guards robustes | formule de défense espionnage branchée sur stats dérivées (`detectionPct` + `counterIntelPct`), cible invalide rejetée explicitement, résolution pilotée par tick runtime central (pas par load opportuniste), UI mission active détaillée, docs/tests resynchronisés | hors-scope restant: intégrations futures combat macro/galaxy avancées | `docs/building/intelligence_center.md`, `docs/08-Espionage.md`, `src/game/city/economy/cityEconomySystem.ts`, `src/game/city/economy/cityEconomyPersistence.ts`, `src/game/render/modes/CityFoundationMode.ts` |
| barracks units | Lot unités | DONE | Gameplay/runtime propre | mapping requis, coûts/temps/population, training flow | corrections gameplay appliquées; renommage user-facing; suppression du champ legacy de butin; `transportCapacity` canonique | dette visuelle (assets unités) hors gameplay | `docs/units/barracks-units.md`, `docs/units/README.md` |
| space_dock units | Lot unités | PARTIAL | Gameplay/runtime propre, visuels incomplets | mapping research/building, coûts/temps/population, training flow | corrections research mapping; ajout modèle `navalAttack`/`navalDefense`; `transportCapacity` canonique; renommage user-facing | dette visuelle: assets dédiés manquants / non branchés UI | `docs/units/space-dock-units.md`, `docs/units/README.md` |
| logique population bâtiment | Transversal runtime/UI | DONE | Validé | règles d’occupation, coût upgrade, garde-fous UI/runtime | occupation = coût niveau courant; coût upgrade = `target-current`; UI incrémentale alignée | rien d’ouvert sur ce scope | `src/game/city/economy/cityEconomySystem.ts`, `src/game/render/modes/CityFoundationMode.ts` |
| renommage technique `watch_tower` → `skyshield_battery` | Transversal config/persistence | DONE | Validé | suppression usage actif `watch_tower`, cohérence catalog/persistence | id runtime remplacé; migration lecture legacy saves vers `skyshield_battery` | aucun scope actif `watch_tower` restant | `src/game/city/economy/cityContentCatalog.ts`, `src/game/city/economy/cityEconomyPersistence.ts`, `docs/building/README.md` |

## 3. Corrections déjà appliquées dans le code
- **Population bâtiment**: occupation calculée sur le **niveau courant uniquement** (plus de cumul de niveaux passés).
- **Upgrade population**: coût d’upgrade = **delta** (`target - current`) et non coût brut cible.
- **UI population**: affichage incrémental aligné avec la logique runtime.
- **Space Dock progression**: corrections de progression aux paliers **L7** et **L27**.
- **Barracks units gameplay**: correctifs gameplay appliqués (cohérence gates/coûts/temps selon lot audité).
- **Space Dock units gameplay**: correctifs de mapping research appliqués.
- **Modèle unités transport/pillage**: suppression du champ legacy de butin; `transportCapacity` est la stat canonique.
- **Modèle unités Space Dock**: ajout/usage de `navalAttack` et `navalDefense`.
- **Renommages user-facing**: lots Barracks et Space Dock harmonisés.
- **Renommage technique bâtiment**: `watch_tower` retiré du scope actif; `skyshield_battery` utilisé et migré côté persistence legacy.
- **Armament anti-doublon**: `armament_factory` ne contribue plus à `trainingSpeedPct`; ce rôle reste à `barracks`/`space_dock` (+ research/policies).
- **Research refactor runtime**: passage d’un modèle instantané à un modèle temporisé (`researchQueue` active), ajout de prérequis de recherches, et guards runtime explicites.
- **Documentation research (strict)**: `docs/research/research_matrix.md` alignée sur les sources runtime uniquement.
- **Naming research**: labels de recherches d’unlock unités alignés sur les unités effectivement gateées par `requiredResearch`.
- **UI research wording**: statuts player-facing alignés sur la réalité runtime timed queue (plus d’état "instant").
- **Research effects clarity**: effets `defensePct` / `antiAirDefensePct` / `marketEfficiencyPct` documentés comme agrégés/partiels selon la consommation runtime réellement active.

## 4. Assets visuels manquants
| Scope | Catégorie | Status | Détail factuel | Impact |
|---|---|---|---|---|
| mine | Bâtiment sans asset | OPEN | asset bâtiment manquant, explicitement documenté | scope reste PARTIAL malgré runtime OK |
| barracks units | Unités sans visuels dédiés | OPEN | visuels dédiés manquants (ou placeholders) pour le lot | lisibilité militaire dégradée |
| space_dock units | Unités sans visuels dédiés | OPEN | visuels dédiés manquants (ou placeholders) pour le lot | lisibilité flotte/défense aérienne dégradée |
| lots unités Barracks + Space Dock | Assets non branchés UI | OPEN | branchement UI incomplet pour visuels unitaires dédiés | rendu UI incomplet |

## 5. Ce qu’il reste à auditer
Scopes non encore traités complètement dans le flux MVP actuel (**audit runtime/config/doc uniquement**):
- aucun scope bâtiment runtime restant.

Le scope `council_chamber` est audité et corrigé côté runtime/catalog/docs/tests (suppression des anciens bonus locaux),
mais son design/fonctionnalité diplomatie macro reste **ouverte** (pas de statut DONE produit final).

## 6. Ce qu’il reste à corriger
Points réellement ouverts après resynchronisation:
- compléter/brancher les assets visuels du lot **barracks units**;
- compléter/brancher les assets visuels du lot **space_dock units**;
- clore le manque visuel du bâtiment **mine** (ou confirmer durablement la décision produit de non-livraison d’asset);
- finaliser le design/runtime macro du `council_chamber` (diplomatie/faction/token participation), aujourd’hui en **DESIGN_PENDING / DIPLOMACY_GATE_ONLY**.

## 7. Ordre de travail recommandé
1. Fermer la dette visuelle: unités Barracks et Space Dock (assets + branchement UI), puis mine bâtiment.
2. Faire une passe finale de validation transversale ÉCONOMIE (runtime + UI + persistence + docs) sur l’ensemble des scopes.
3. Passer les scopes en `DONE` uniquement après fermeture des ouverts réels.

## 8. Règles de lecture du tracker
- **DONE**: scope audité et validé sur le périmètre annoncé, sans ouvert bloquant restant dans ce scope.
- **PARTIAL**: scope audité en partie ou validé gameplay/runtime mais avec ouvert(s) explicite(s) restant(s) (ex: visuels/UI assets).
- **TODO**: scope non encore audité de manière suffisante dans le flux MVP courant.


## 9. TODO MVP produit / gameplay / vues
> Cette section couvre les **TODO features / product scope MVP** (distincts des TODO d’audit runtime des sections 5 et 6).

### Gameplay systems
- [ ] Gestion guerre
- [ ] Gestion macro du jeu
- [ ] Gestion micro du jeu

### Combat / war
- [ ] Système de bataille ainsi que la logique atk vs def

### Expansion / colonization
- [ ] Système de colonisation

### Trading / market
- [ ] Système de trading / market

### Espionage
- [x] Système d’espionnage (MVP: mission ville->ville, vault silver, résolution, rapports)

### Grepolis replacement decisions
- [ ] Mettre en place le système de généraux (remplacement temple/gods) via système dédié `war_council` / `high_command`
- [ ] Implémenter les pouvoirs actifs des généraux
- [ ] Implémenter les unités spéciales / "mythiques" liées aux généraux

### UI / views
- [ ] Corriger la vue galaxy
- [ ] Corriger la vue planète

### Finalisation content
- [ ] Finaliser les bâtiments
- [ ] Finaliser les unités

## 10. Priorités MVP restantes
### A. Audit / implémentation runtime existante
1. Fermer la dette visuelle encore ouverte (assets unités Barracks + Space Dock, puis asset bâtiment mine).
2. Maintenir la synchro runtime/config/docs/tests sur les scopes déjà audités.
3. Council chamber: garder l’absence de bonus locaux; implémenter ensuite le consumer macro diplomatie quand spécification produit validée.

### B. Features / product scope MVP
1. Finaliser les fondations gameplay globales (macro + micro + guerre).
2. Implémenter/valider les systèmes cœur restants (bataille atk/def, colonisation, trading/market).
3. Implémenter le système dédié de généraux (`war_council`/`high_command`) puis les unités spéciales associées (future feature).
4. Corriger les vues majeures restantes (`galaxy`, `planète`).
5. Finaliser contenu bâtiments/unités après convergence runtime + features produit.

## 11. Research feature truth snapshot (runtime-grounded)
- **Implemented and stable**: timed queue, research guards (lab/prereq/RP/resources/queue), completion flow, persistence + legacy migration, research UI statuses/timers/RP display.
- **Fully wired families**: unit unlock gates, production bonuses, training speed bonuses, build speed bonuses, espionage/intel gates (`espionage`, `cryptography`).
- **Partially wired families**: `defensePct`, `antiAirDefensePct`, `marketEfficiencyPct` effects are mostly aggregated/surfaced; not all have complete gameplay subsystem consumers in the audited runtime scope.
- **Not implemented (feature-parent dependency)**: `conquest` research is declared but conquest/colonization mother feature is not runtime-live in this scope.
- **Ambiguous mapping to clarify**: `cartography`, `recovery_logistics` (current runtime bucket leans market/logistics aggregation; intended navigation/conquest linkage requires product clarification).
- **Audit references**: `docs/research/research_feature_audit.md`, `docs/research/research_gap_report.md`, `docs/research/README.md`.

## 12. Inventory & NFT Items
- **Status**: `Planned / Documentation Ready`
- **Scope**: système d'inventaire + items bonus inspiré Grepolis, adapté Coinage, avec trajectoire NFT progressive.
- **Implémentation runtime**: **non démarrée** (documentation uniquement à ce stade).
- **Référence doc**: `docs/features/inventory-items/`
- **Dépendances MVP**:
  - système inventaire off-chain (templates/instances/usage)
  - validations serveur anti-abus (combat windows, locks, caps)
  - base marketplace lock semantics
- **Dépendances post-MVP**:
  - mint/burn/transfer NFT
  - marketplace full integration
  - gouvernance saison/serveur des items puissants

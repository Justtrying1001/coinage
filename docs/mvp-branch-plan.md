# Coinage — MVP Branch Plan

## 1. Working rule
Le pilotage MVP se fait strictement branche par branche.
On ne lance pas une nouvelle branche tant que la branche active n’est pas réellement complète.
« Complète » veut dire : gameplay jouable, UI/UX compréhensible, visuels/assets minimums présents, bugs critiques corrigés, branchements techniques minimums faits, validation de branche exécutée.
Les besoins techniques (runtime, persistance minimale, API minimale) sont traités dans la branche concernée, pas dans une grosse branche backend séparée en amont.
Le design DB global détaillé est explicitement reporté : on ne le fige pas maintenant.
Les anciens documents Step restent des archives/références, mais ne pilotent plus le travail quotidien.
Le plan actif est uniquement ce document + `docs/mvp-tracker.md`.

## 2. Branch order
1. Économie
2. Militaire
3. Research
4. Monde / Travel / Colonisation
5. Market
6. Gouvernance
7. Onboarding / Identity
8. Validation intégrée MVP

## 3. Branch details

### Branche 1 — Économie
#### Scope
La branche ÉCONOMIE couvre le socle runtime commun de **tous les bâtiments** (pas seulement les bâtiments “éco”):
- ressources (production, stockage, caps, claim offline, dépenses, blocages),
- construction/upgrade (guards, coûts, durées, file, résolution),
- prérequis, niveaux max, effets réels appliqués,
- feedbacks UI et visuels/assets bâtiment.

Important: la branche MILITAIRE reprend les unités/combat, mais **pas la revalidation du système bâtiment**.

#### Known problems today
- Le stock initial dépasse les caps de base (`startingStock` > `baseStorageCap` sur ore/stone), ce qui rend le spawn trompeur.
- `buildCostReductionPct` est déclaré côté effets mais non appliqué au coût réellement payé (multiplicateur fixé à 1).
- L’UI économie peut afficher des % cap > 100 selon l’écran (incohérence de bornage).
- Certains labels UI (“Live/Core”) donnent une impression de complétude plus élevée que la réalité runtime.
- La validation bâtiment par bâtiment n’est pas terminée sur l’ensemble des bâtiments existants.
- Cas à vérifier explicitement: `barracks` niveau 1 (durée perçue ~15 min selon conditions runtime/senate normalization).
- Mapping visuels bâtiment incomplet (fallback “No Art” encore possible).

#### Work to do
- Lister et valider **tous les bâtiments runtime**: `hq`, `mine`, `quarry`, `refinery`, `warehouse`, `housing_complex`, `barracks`, `space_dock`, `defensive_wall`, `skyshield_battery`, `armament_factory`, `intelligence_center`, `research_lab`, `market`, `council_chamber`.
- Pour chaque bâtiment: valider coût/durée/prérequis/max level/effet runtime réel/feedback UI/visuel.
- Corriger l’invariant spawn ressources/caps.
- Corriger les calculs incomplets (`buildCostReductionPct` et autres modificateurs déclarés non actifs).
- Traiter explicitement le cas `barracks` niveau 1 (durée/coût/prérequis/effet/asset).
- Corriger le mapping nom canonique bâtiment ↔ nom technique ↔ fichier visuel.
- Uniformiser l’UI (caps bornés, erreurs/confirmations lisibles, suppression labels trompeurs).
- Exécuter validation de branche complète (scénarios build/reload/claim/upgrade/effet).

#### Technical needs included in this branch
- Corrections runtime dans `cityEconomySystem` (construction, coûts, durées, effets).
- Sanitation persistance locale dans `cityEconomyPersistence` (invariants stock/cap/files/niveaux).
- Corrections UI dans `CityFoundationMode` (cohérence affichage/runtime, labels, feedbacks).
- Corrections de mapping assets bâtiment + tests ciblés construction/effets.

#### Done criteria
La branche est finie uniquement si:
- ressources cohérentes au spawn et au chargement,
- construction/upgrade validés pour **tous les bâtiments**,
- coûts/durées/prérequis/effets vérifiés pour **tous les bâtiments**,
- cas `barracks` niveau 1 traité,
- mapping bâtiment ↔ visuel propre (pas de trous critiques),
- UI alignée avec le runtime (pas d’infos trompeuses),
- validation de branche exécutée sur scénarios concrets.

#### Current status
Partial.

### Branche 2 — Militaire
#### Scope
Unités, recrutement, défense, combat, pillage/transport, UI militaire et feedbacks associés.

#### Known problems today
- Visuels troupes manquants ou incomplets.
- Erreurs sur certaines unités (comportement/rôle/cohérence à corriger).
- Coûts et temps de recrutement à corriger ou valider.
- Défense à finaliser (règles et résultat lisible).
- Combat à finaliser (résolution de bout en bout).
- Pillage / transport à définir ou brancher réellement.
- UI militaire et feedbacks à améliorer (états d’action, erreurs, résultats).

#### Work to do
- Nettoyer le catalogue d’unités et corriger les anomalies connues.
- Finaliser le recrutement (coûts, temps, files, feedback utilisateur).
- Finaliser la défense et sa lecture UI.
- Brancher une résolution combat MVP fiable.
- Définir/brancher le flux pillage/transport minimum.
- Compléter les assets minimums troupes et harmoniser l’UI militaire.
- Valider la branche sur un scénario recrutement → déplacement/pillage → combat → résultat.

#### Technical needs included in this branch
- Branchement runtime des actions militaires (recrutement, défense, combat, transport/pillage).
- Persistance minimale des files/statuts militaires nécessaires.
- Corrections techniques ciblées sur unités et guards.

#### Done criteria
Le militaire est jouable et lisible : unités cohérentes, recrutement fiable, défense/combat fonctionnels, pillage/transport minimum opérationnels, visuels minimums présents et validation de branche réussie.

#### Current status
Partial.

### Branche 3 — Research
#### Scope
Système research MVP : contenus retenus, coûts/temps, effets, UI research.

#### Known problems today
- Le périmètre research MVP n’est pas assez verrouillé.
- Certains effets sont partiels ou pas assez traçables vers les systèmes impactés.
- L’écran research n’est pas encore suffisamment clair sur prérequis/coûts/retours.

#### Work to do
- Fixer un set research MVP court et utile.
- Associer explicitement chaque recherche à des effets concrets et limités.
- Finaliser la UI research (prérequis, états, progression, erreurs).
- Vérifier la cohérence économie/militaire des effets research.
- Exécuter une validation de branche dédiée.

#### Technical needs included in this branch
- Branchement runtime des effets research retenus.
- Persistance minimale progression research.
- Vérifications de non-régression sur économie/militaire liées aux bonus research.

#### Done criteria
Research est clair et utile en jeu : liste fermée, effets compréhensibles et effectivement appliqués, UI lisible, validation de branche passée.

#### Current status
Not ready.

### Branche 4 — Monde / Travel / Colonisation
#### Scope
State monde exploitable, déplacements, ETA/arrivée, claim/ownership, résolution de conflits, UI monde.

#### Known problems today
- Pas de vérité monde suffisamment partagée pour l’ownership/occupation.
- Navigation présente mais encore trop découplée d’un état monde exploitable.
- Travel macro incomplet (ordre → ETA → arrivée non fiabilisé).
- Colonisation/claim non branchés de bout en bout.
- Arbitrages conflit (travel/combat/colonisation) non finalisés en runtime.

#### Work to do
- Stabiliser un world state MVP minimal et déterministe.
- Brancher travel complet avec statuts clairs.
- Implémenter colonisation/claim avec ownership explicite.
- Appliquer l’ordre de résolution des conflits dans le runtime.
- Finaliser la UI monde (ownership, ETA, conflits, erreurs).
- Valider la branche sur scénarios navigation → travel → claim → conflit.

#### Technical needs included in this branch
- Runtime partagé minimal pour état monde/ownership.
- Persistance minimale des actions travel/claim nécessaires à la cohérence.
- Gestion technique des conflits concurrentiels sur cibles communes.

#### Done criteria
Le monde est exploitable sans ambiguïté : déplacements et colonisation fonctionnent, ownership est fiable, conflits sont résolus de façon stable, UI monde est lisible, validation de branche réussie.

#### Current status
Blocked by upstream branches.

### Branche 5 — Market
#### Scope
Market MVP opérationnel : ordres, réservation ressources, exécution/annulation, UI market.

#### Known problems today
- Surface UI existante mais exécution de trade non branchée.
- Pas de moteur complet create/fill/cancel pour le market MVP.
- Cohérence ressources/réservations insuffisamment garantie.

#### Work to do
- Définir le modèle d’ordre MVP (champs, statuts, règles).
- Implémenter réservation/dé-réservation ressources.
- Brancher create/fill/cancel avec contrôles d’intégrité.
- Rendre la UI market explicite sur statuts/erreurs/résultats.
- Valider la branche sur scénarios de transactions critiques.

#### Technical needs included in this branch
- Runtime minimal de matching/exécution requis pour MVP.
- Persistance minimale des ordres et réservations actives.
- Gardes techniques anti-incohérences de ressources.

#### Done criteria
Le market est réellement utilisable : créer/remplir/annuler fonctionne, ressources restent cohérentes, UI est claire, validation de branche passée.

#### Current status
Not ready.

### Branche 6 — Gouvernance
#### Scope
Token/alliance, décisions de gouvernance, effets appliqués, cadence, UI gouvernance.

#### Known problems today
- Gouvernance surtout présente en config/UI locale, boucle macro incomplète.
- Effets de décisions pas assez branchés sur les systèmes impactés.
- Cadence décisionnelle et feedback joueur insuffisamment définis.

#### Work to do
- Finaliser appartenance token/alliance côté gameplay.
- Définir et brancher un set de décisions MVP utile.
- Appliquer les effets de gouvernance de manière observable.
- Fixer la cadence MVP (fenêtres/rythme) et ses règles.
- Finaliser la UI gouvernance et valider la branche.

#### Technical needs included in this branch
- Branchement runtime des décisions et de leurs effets.
- Persistance minimale de l’état de gouvernance utile.
- Intégration technique avec systèmes impactés (économie, militaire, etc.).

#### Done criteria
La gouvernance MVP est active et lisible : décisions utilisables, effets visibles en jeu, cadence claire, UI compréhensible, validation de branche réussie.

#### Current status
Not ready.

### Branche 7 — Onboarding / Identity
#### Scope
Entrée utilisateur MVP : username/session, first-session, sélection token/alliance, UI onboarding.

#### Known problems today
- Landing et accès jeu existent, mais flux d’identité MVP incomplet.
- Création/continuité de session utilisateur pas assez cadrée.
- Parcours first-session trop léger pour guider correctement le joueur.

#### Work to do
- Mettre en place un flux username/session simple et fiable.
- Construire un first-session guidé (étapes minimales indispensables).
- Brancher la sélection token/alliance dans le parcours d’entrée.
- Finaliser les feedbacks onboarding (erreurs, confirmations, progression).
- Valider la branche avec un scénario nouveau joueur complet.

#### Technical needs included in this branch
- Gestion technique minimale de session/identité MVP.
- Persistance minimale des choix onboarding (username, token/alliance).
- Branchement onboarding vers les systèmes actifs du jeu.

#### Done criteria
Un nouveau joueur peut entrer, créer son identité MVP, faire ses choix initiaux et démarrer correctement la boucle de jeu avec un parcours clair validé.

#### Current status
Partial.

### Branche 8 — Validation intégrée MVP
#### Scope
Validation inter-branches de la version MVP complète avant go/no-go.

#### Known problems today
- Les validations sont encore fragmentées par système.
- Risque de faux-positifs si on se contente de vérifier des briques isolées.

#### Work to do
- Exécuter des scénarios end-to-end couvrant les chemins critiques.
- Vérifier les cas limites inter-systèmes (économie/militaire/monde/market/gouvernance).
- Produire une décision go/no-go explicite avec blocants résiduels.

#### Technical needs included in this branch
- Outils/checklists de validation intégrée.
- Traces minimales pour diagnostiquer les écarts critiques.
- Corrections finales de branchement inter-systèmes si nécessaires.

#### Done criteria
Les scénarios critiques passent de bout en bout, les incohérences majeures sont fermées, et une décision go/no-go MVP est prise sur base de preuves de validation intégrée.

#### Current status
Not ready.

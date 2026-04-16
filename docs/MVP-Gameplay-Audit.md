# Audit Gameplay MVP — Coinage

## 1. MVP GAMEPLAY SCOPE (SOURCE OF TRUTH)

### 1.1 Ressources

**Ressources présentes en MVP (strictement confirmées):**
- Ore
- Stone
- Iron

**Ressources explicitement hors MVP:**
- Shards (monétisation / premium, pas dans la liste des inclus MVP)
- Signal de faction (ajouté en V1)

**Production (fonctionnement exact):**
- Modèle temps réel continu en claim-on-access.
- Formule canonique : `ressources_gagnees = heures_ecoulees × production_horaire × multiplicateur_holding`.
- Application du cap : `nouveau_stock = min(stock_actuel + ressources_gagnees, storage_cap)`.
- Pas de job de fond requis : calcul au moment d’accès.
- Règle transactionnelle : relecture serializable + interdiction d’incrément/décrément aveugle ORM.

**Storage cap (règles exactes):**
- Ore : cap de base 500
- Stone : cap de base 300
- Iron : cap de base 200
- Extension du cap via Entrepôt
- Si cap atteint : la production s’arrête jusqu’à dépense

**NOTE MVP:** le multiplicateur de holding appartient à la logique token/on-chain ; la Roadmap place la connexion token en V1. Pour MVP, ce multiplicateur est donc ambigu (voir sections 4 et 5).

### 1.2 Boucle de gameplay principale

Boucle MVP exacte (à partir des docs uniquement):
1. Onboarding léger
2. Création de ville
3. Attribution d’un premier secteur neutre
4. Production continue des ressources de base (claim-on-access)
5. Construction/upgrade de bâtiments de ville (dans le périmètre micro-économie)
6. Progression de la ville via amélioration de production/capacité de stockage
7. Visualisation du monde 2D sectorisé

### 1.3 Bâtiments MVP uniquement

> Règle de filtrage appliquée : uniquement ce qui est nécessaire à “boucle ville + carte sectorisée + production continue”, en excluant militaire/espionnage/recherche/trading/gouvernance.

**Bâtiments MVP retenus:**
1. **HQ (Headquarters)**
   - Rôle : prérequis de déblocage des autres bâtiments
   - Condition de déblocage : état initial (bâtiment de base de la ville)

2. **Mine**
   - Rôle : production passive d’Ore
   - Condition de déblocage : HQ niveau 1

3. **Carrière**
   - Rôle : production passive de Stone
   - Condition de déblocage : HQ niveau 1

4. **Raffinerie**
   - Rôle : production passive d’Iron
   - Condition de déblocage : HQ niveau 3

5. **Entrepôt**
   - Rôle : augmentation du storage cap Ore/Stone/Iron
   - Condition de déblocage : HQ niveau 1

6. **Housing Complex**
   - Rôle : augmentation du cap de population
   - Condition de déblocage : HQ niveau 1

**Bâtiments explicitement exclus du MVP (même s’ils existent au catalogue):**
- Caserne, Forge de combat, Hub de déploiement, Académie militaire, Mur défensif, Tour de guet, Usine d’armement
- Centre d’espionnage
- Laboratoire de recherche
- Marché
- Council Chamber
- Shard Vault (lié premium)

### 1.4 Système de construction

**Queue (nombre de slots):**
- Règle générale système : Queue F2P = 2 slots simultanés
- Queue Premium : jusqu’à 5 via Shards

**Règles exactes connues:**
- Coût déduit au lancement de la construction
- Annulation non autorisée
- Prérequis : niveau HQ + prérequis bâtiment
- Unicité : 1 seul bâtiment de chaque type par ville
- Niveau max standard : 20

**Comportement exact attendu en MVP (strictement déductible):**
- Construction parallèle possible (2 slots F2P)
- Vérification des prérequis au lancement
- Débit de ressources au lancement
- Pas d’annulation possible

**Ambigu pour MVP:**
- Utilisation de queue premium (Shards non inclus MVP)
- Nombre fixe total de slots par ville (valeur chiffrée absente)

### 1.5 Population

**Population active en MVP ?**
- Le système population est documenté en micro gameplay, mais la Roadmap MVP ne mentionne pas explicitement cette mécanique.

**Fonctionnement documenté:**
- Cap population fourni principalement par Housing Complex
- Population consommée par bâtiments + troupes vivantes
- Housing Complex et Entrepôt ne consomment pas de population

**Impact réel MVP (état actuel d’audit):**
- Usage troupes = hors MVP
- Reste possible uniquement la consommation par bâtiments
- MAIS absence de table de coûts population des bâtiments dans les docs fournis ⇒ impossible de coder proprement sans décision produit

---

## 2. GAME STATE MODEL (IMPORTANT POUR CODE)

### 2.1 Ville

État minimal requis côté modèle MVP:
- `city_id`
- `player_id`
- `sector_id` (territoire principal / premier secteur neutre attribué)
- Ressources: `ore`, `stone`, `iron`
- Caps: `ore_cap`, `stone_cap`, `iron_cap`
- `last_resource_update_at` (claim-on-access)
- Bâtiments (niveau par type MVP):
  - `hq_level`
  - `mine_level`
  - `quarry_level`
  - `refinery_level`
  - `warehouse_level`
  - `housing_complex_level`
- Population (si activée MVP):
  - `population_cap`
  - `population_used`
- Timers de construction (voir 2.3)

### 2.2 Production

**Formule exacte (docs):**
- `ressources_gagnees = heures_ecoulees × production_horaire × multiplicateur_holding`
- `nouveau_stock = min(stock_actuel + ressources_gagnees, storage_cap)`

**Déclenchement:**
- Claim-on-access uniquement (lecture/écriture de ville ou ressources)

**Contraintes transactionnelles obligatoires:**
- Transaction serializable
- Clamp haut via `min(..., cap)` pour gains
- Clamp bas via `max(0, ... )` pour dépenses

### 2.3 Construction

**Queue minimale MVP:**
- File de constructions avec au moins 2 slots parallèles (F2P)

**Champs d’état minimaux par entrée de queue:**
- `queue_item_id`
- `city_id`
- `building_type`
- `target_level`
- `started_at`
- `ends_at`
- `status` (en cours / terminée)
- `cost_snapshot` (coût prélevé au lancement)

**Progression:**
- Au lancement: vérifier prérequis + ressources disponibles + slots disponibles
- Débiter immédiatement le coût
- Marquer la fin via timer
- À l’échéance: appliquer le niveau bâtiment
- Annulation interdite

---

## 3. CE QUI EST HORS MVP (À NE PAS BUILDER)

Exclusions explicites selon roadmap + docs:
- Unités de base et système militaire complet (V0+)
- Raids
- Sièges
- Colonisation militaire / capture
- Espionnage
- Recherche individuelle
- Trading inter-villes
- Signal de faction
- Auth wallet / validation holding on-chain
- Branches collectives (économie/militaire/diplomatie)
- Conseil / gouvernance
- Alliances / diplomatie avancée
- Guerres officielles
- End game saisonnier / classement final
- Monétisation complète (dont queue premium via Shards) tant que non cadrée MVP

---

## 4. INCOHÉRENCES / PROBLÈMES IDENTIFIÉS

1. **Multiplicateur de holding conflictuel pour MVP**
   - Présent dans formule de production ressources
   - Mais la connexion token/holding est planifiée en V1
   - Donc dépendance on-chain incompatible avec MVP “validation d’attractivité”

2. **Shards en friction de scope**
   - Ressource documentée (cap, shard vault, premium queue)
   - Mais MVP n’inclut pas monétisation mature ni wallet
   - Statut “actif ou non en MVP” non tranché

3. **Population non alignée MVP**
   - Système détaillé dans doc micro (bâtiments + troupes)
   - MVP exclut troupes, et ne précise pas explicitement si population est activée côté bâtiments

4. **Bâtiment “Raffinerie” débloqué HQ 3 sans état initial HQ défini**
   - On a des seuils de déblocage, mais pas le niveau HQ initial de la ville
   - Impact direct sur la boucle early game

5. **Construction : “nombre fixe de slots par ville” sans valeur absolue**
   - On sait queue F2P=2 et premium jusqu’à 5
   - Mais le “nombre fixe” de slots structurels n’est pas explicité

6. **Coûts/temps de construction non fournis dans le périmètre documents utilisé**
   - Règles de fonctionnement présentes
   - Paramètres de balancing absents (coûts, durées, courbes)

7. **Storage cap protégé du pillage (Entrepôt 10%) mentionné mais pillage hors MVP**
   - Effet existant mais non utile dans périmètre MVP

8. **Roadmap MVP mentionne “boucle ville + carte sectorisée” sans lister explicitement les bâtiments MVP**
   - Nécessite une décision de cadrage pour éviter dérive implémentation

---

## 5. BLOCKERS AVANT DEV

Décisions obligatoires avant implémentation MVP:
1. **Niveau initial exact de chaque bâtiment au spawn** (au minimum HQ, Mine, Carrière, Entrepôt, Housing, Raffinerie oui/non)
2. **État initial exact des ressources** (stock de départ Ore/Stone/Iron)
3. **Activation ou non du multiplicateur de holding en MVP**
4. **Activation ou non de Shards en MVP** (et donc premium queue oui/non)
5. **Règles population MVP**
   - Active ou inactive
   - Si active: table de consommation population par bâtiment
6. **Tables de balancing minimales MVP**
   - Production horaire par niveau bâtiment
   - Coûts de construction/upgrade
   - Durées de construction/upgrade
7. **Nombre de slots de construction réellement exposés en MVP**
   - 2 fixes F2P uniquement ?
   - Premium désactivé ?
8. **Définition opérationnelle des triggers claim-on-access**
   - Quelles endpoints/actions recalculent les ressources
9. **Règles exactes d’attribution du premier secteur neutre**
   - Critère de sélection du secteur
   - Garanties anti-collision en concurrence

---

## 6. MVP BUILD CHECKLIST

- [ ] Scope MVP figé (aucun module V0/V1/V2/V3 activé)
- [ ] Onboarding léger implémenté
- [ ] Création de ville implémentée
- [ ] Attribution premier secteur neutre implémentée
- [ ] Visualisation monde 2D sectorisé disponible
- [ ] Ressources MVP limitées à Ore/Stone/Iron (ou décision explicite contraire validée)
- [ ] Claim-on-access implémenté avec formule canonique
- [ ] Storage caps Ore/Stone/Iron implémentés
- [ ] Clamp transactionnel (`min`/`max`) implémenté
- [ ] Bâtiments MVP strictement limités à: HQ, Mine, Carrière, Raffinerie, Entrepôt, Housing Complex
- [ ] Prérequis HQ respectés pour déblocages bâtiments MVP
- [ ] Queue construction MVP implémentée (2 slots F2P minimum)
- [ ] Règle “coût au lancement” implémentée
- [ ] Règle “annulation interdite” implémentée
- [ ] Unicité bâtiment par type implémentée
- [ ] Niveau max bâtiment standard = 20 implémenté
- [ ] Population: décision explicite prise (active/inactive) avant code
- [ ] Multiplicateur holding: décision explicite prise (actif/inactif) avant code
- [ ] Shards/premium queue: décision explicite prise (actif/inactif) avant code
- [ ] Tous les blockers section 5 résolus avant démarrage dev

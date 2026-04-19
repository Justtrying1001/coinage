# Vault Warfare System

*Spécification gameplay — couche avancée de guerre économique tokenisée.*

Version 1.0 — Avril 2026

## 1) Concept central

Le **Vault Warfare System** transforme le coffre (vault) en **objectif stratégique à part entière** :

- engagement économique (lock de tokens),
- avantages in-game,
- exposition au risque (pillage),
- via une **mécanique de raid dédiée**, distincte du combat classique.

Le coffre n’est donc pas une simple réserve passive, mais une couche high-stakes optionnelle.

## 2) Structure du coffre (Vault)

Chaque coffre est composé de 3 dimensions :

### A. Principal locké

- Montant de tokens verrouillés par le joueur (ou sa faction selon le mode de gouvernance choisi).
- Définit le **niveau de coffre**.
- Débloque des paliers de bonus.
- Majoritairement protégé.

### B. Part exposée (pillage possible)

- Fraction vulnérable du coffre.
- Plafonnée par des règles de sécurité globales.
- Dépendante du niveau de coffre et de ses défenses dédiées.

### C. Niveau de coffre

Le niveau du coffre pilote :

- capacité maximale,
- bonus attribués,
- ratio sécurisé vs exposé,
- résistance aux raids.

## 3) Couche dédiée : Défense de coffre

La défense de coffre est **séparée** de la défense de ville.

### Défense de ville (couche existante)

Protège :

- ressources classiques,
- bâtiments,
- accès global de la ville.

### Défense de coffre (nouvelle couche)

Protège :

- tokens lockés,
- réserve pillable,
- accès opérationnel au vault.

### Leviers de défense de coffre

- Fortification du vault (réduction des pertes extraites).
- Sécurité interne (HP / résistance structurelle).
- Mécanismes anti-breach.
- Protection progressive (shield, régénération, cooldown).
- Base inviolable minimale.

## 4) Raid de coffre (flux en 3 phases)

Le coffre ne peut pas être pillé instantanément. Un raid spécialisé est requis :

### Phase 1 — Assaut ville

- Neutraliser les défenses classiques.
- Ouvrir une fenêtre d’accès au coffre.

### Phase 2 — Breach du coffre

- Utiliser des unités/capacités dédiées au breach.
- Éroder la sécurité propre du vault.

### Phase 3 — Extraction

- Extraction progressive (non instantanée).
- Contrôle continu requis pendant la fenêtre d’extraction.
- Interruption possible si les défenseurs reprennent le contrôle.

**Intention design :** le vault devient un objectif de siège et de contrôle, pas un loot opportuniste.

## 5) Droit de pillage (anti-snipe)

Le droit de capturer dépend de l’engagement réel, pas du dernier hit.

Conditions d’éligibilité possibles :

- contribution minimale (dégâts, durée de présence, unités engagées),
- participation active à la phase de breach,
- ou déclenchement initial du breach.

Résultat : impossible de laisser des tiers “nettoyer” puis de venir terminer pour voler l’intégralité du butin.

## 6) Protections anti-exploit

Le système doit mitiger structurellement :

- **Sniping opportuniste** (capture rights + extraction progressive),
- **Comptes jetables** (investissement requis pour accéder au raid vault),
- **Multi-account farming** (plafonds + coûts + contribution minimale),
- **Vidage instantané** (caps et extraction par ticks).

## 7) Plafonds et sécurité

Le coffre ne doit jamais être vidé brutalement.

Règles candidates :

- % max pillable par raid,
- % max pillable par période (ex: jour),
- base inviolable (ex: 60–80% selon niveau),
- réduction des pertes via upgrades défensifs,
- cooldown entre raids réussis.

Objectif : créer un risque réel sans détruire la viabilité du joueur attaqué.

## 8) Compatibilité F2P (contrainte produit)

Le système coffre est une couche avancée, pas une obligation.

### Boucle F2P sans lock (doit rester complète)

- économie,
- armée,
- combat classique,
- pillage classique,
- progression,
- alliances.

### Accès au gameplay vault

- Joueur sans lock : n’accède pas au pillage vault avancé, mais conserve un gameplay complet.
- Joueur avec lock : accède à la couche high-stakes (bonus + risque + raids dédiés).

## 9) Symétrie économique

Principe fondamental :

> On ne peut piller de la valeur tokenisée que si l’on s’expose soi-même à cette valeur.

Implications :

- nécessité d’un coffre actif pour piller un coffre,
- capacité de pillage limitée par le niveau de son propre coffre,
- engagement économique réciproque.

Ce principe limite les comportements parasites et les attaques à faible coût.

## 10) Redistribution du butin

Le butin n’est pas forcément 100% transféré à l’attaquant.

Exemple de modèle :

- 70% attaquant,
- 20% réserve/alliance,
- 10% burn/fraction de friction systémique.

Effets recherchés :

- limiter le snowball,
- réduire l’intérêt des boucles d’exploit,
- maintenir une économie circulaire.

## 11) Rôle gameplay du coffre

Le coffre peut apporter :

- bonus de production,
- bonus de vitesse,
- capacités stratégiques,
- prestige / ranking,
- influence politique (optionnelle),
- enjeu de guerre.

Mais il ne doit pas :

- absorber tout le power budget,
- rendre le F2P non viable,
- devenir un système purement pay-to-win.

## 12) Synthèse design

### Avant

- bonus passif de holder.

### Après

- engagement économique explicite,
- richesse partiellement exposée,
- conflits stratégiques orientés capture de valeur réelle.

Le coffre devient un pivot stratégique, économique et militaire du mid/end-game.

## 13) TL;DR

- Les joueurs lock des tokens dans un coffre.
- Le coffre donne des bonus mais expose une part au risque.
- Le coffre a une défense dédiée (séparée de la ville).
- Il faut un raid spécialisé (assaut, breach, extraction) pour piller.
- Le pillage dépend de l’engagement réel (pas du last hit).
- Les pertes sont plafonnées, progressives et encadrées.
- Le système cible des joueurs engagés et réduit les exploits.
- Le jeu reste pleinement jouable en F2P sans lock.

## 14) One-liner produit

Passage d’un système “holder bonus” à une **richesse stratégique attaquable**, via une couche de combat dédiée au coffre.

## 15) Prochaine étape recommandée

Transformer cette vision en **GDD implémentable MVP** avec :

- règles chiffrées (caps, seuils, cooldown),
- formules de breach/extraction,
- progression de coffre par paliers,
- plan de balance et instrumentation analytics.

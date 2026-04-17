# Bâtiments & Construction — Core non-premium (Global pass v1)

> Source of truth runtime: `src/game/city/economy/cityEconomyConfig.ts`.
> Source of truth full-core (incluant branches non encore implémentées runtime): `src/game/city/economy/cityContentCatalog.ts`.

## 1) Périmètre actif

### 1.1 Core non-premium inclus

| Branche | Bâtiments |
|---|---|
| Économie | HQ, Mine, Quarry, Refinery, Warehouse, Housing Complex |
| Militaire | Barracks, Combat Forge, Space Dock, Military Academy, Armament Factory |
| Défense | Defensive Wall, Watch Tower |
| Support/logistique | Market |
| Recherche / intel / gouvernance | Research Lab, Intelligence Center, Council Chamber |

### 1.2 Hors périmètre (différé)

- `training_grounds`
- `shard_vault`
- Toute mécanique premium / prestige

---

## 2) Intentions de balance (pass global)

1. **Early game (L1–L5)** rapide et lisible.
2. **Onboarding (L6–L10)**: premières vraies contraintes de prérequis + stockage.
3. **Midgame (L11–L15)**: arbitrage éco/militaire/support.
4. **Late (L16–L20)**: engagement long, sans cliff brutal de timers.

Ajustements centraux appliqués:
- pente late des timers adoucie (`lateGrowth 1.90 -> 1.86`), pour éviter le mur L11+.
- `Housing Complex` fortement réduit pour restaurer la pression population.
- coûts pop bâtiments militaires et troupes relevés.
- `Warehouse` resserré (caps plus contraignants) pour re-rendre le stockage structurant.
- branches late (Wall/Tower/Academy/Factory/Intel/Lab/Market/Council) converties en **investissements opérationnels** (effets scalés utiles), pas en taxe de déblocage.

---

## 3) Graphe de prérequis (core global)

## 3.1 Spine centrale

- `HQ 1` → Mine, Quarry, Warehouse, Housing Complex
- `HQ 2 + Housing 2` → Barracks
- `HQ 3 + Mine 4 + Quarry 4` → Refinery
- `HQ 6 + Barracks 8 + Refinery 5` → Combat Forge
- `HQ 10 + Combat Forge 5 + Refinery 6` → Space Dock

## 3.2 Branches support / late non-premium

- `Defensive Wall`: HQ 4
- `Watch Tower`: HQ 5 + Defensive Wall 2
- `Research Lab`: HQ 4 + Warehouse 4
- `Intelligence Center`: HQ 4 + Watch Tower 2
- `Market`: HQ 5 + Warehouse 5 + Research Lab 2
- `Council Chamber`: HQ 8 + Research Lab 5 + Market 4
- `Military Academy`: HQ 12 + Combat Forge 10 + Research Lab 8 + Council Chamber 4
- `Armament Factory`: HQ 12 + Space Dock 8 + Refinery 10 + Market 6

---

## 4) Tables de balance — bâtiments

## 4.1 Runtime (implémenté)

| Bâtiment | Profil coût/temps | Pop bâtiment | Valeur opérationnelle |
|---|---:|---:|---|
| HQ | 220/180/35, scale 1.195, base 50s | 1→2→3 (bands) | Spine d’unlock globale |
| Mine | 76/60/0, scale 1.16, base 30s | 1→2→2 | Ore/h (expo 30 @1, scale 1.15) |
| Quarry | 68/78/0, scale 1.16, base 30s | 1→2→2 | Stone/h (expo 26 @1, scale 1.15) |
| Refinery | 125/105/35, scale 1.165, base 45s | 1→2→2 | Iron/h (expo 14 @1, scale 1.17) |
| Warehouse | 90/84/10, scale 1.17, base 35s | 0 | Cap absolu stockage |
| Housing Complex | 90/84/10, scale 1.17, base 35s | 0 | Cap population (formule réduite) |
| Barracks | 140/110/20, scale 1.2, base 50s | 1→2→2 | Entrée line-up ground |
| Combat Forge | 240/205/80, scale 1.21, base 65s | 1→2→3 | Ground avancé |
| Space Dock | 360/300/150, scale 1.22, base 80s | 2→3→4 | Projection / convoyage |

**Pressure points rétablis**
- `Population.baseCap = 90` (avant 120)
- `Warehouse caps` démarrent à **1200/1000/700** et finissent à **110500/88400/59700**
- `Housing bonus` = `70 + 42L + 2L²` (au lieu de la courbe précédente beaucoup plus généreuse)

## 4.2 Branches non-runtime mais balancées (catalogue full-core)

| Bâtiment | Identité opérationnelle (scaling) |
|---|---|
| Defensive Wall | Défense globale ville, mitigation siège, résilience de phase finale |
| Watch Tower | Fenêtre d’alerte, interception garnison, anti-stealth |
| Military Academy | Réduction temps d’entraînement ground/siege + slots doctrine |
| Armament Factory | Réduction coût Iron militaire + accélération production/projection |
| Intelligence Center | Résilience contre espionnage + paliers missions 1/5/10/15/20 |
| Research Lab | RC +3/niveau + accélération cycle recherche |
| Market | Throughput convois, réduction taxe de transfert, slots routes |
| Council Chamber | Vote weight, slots policy, réduction prep mobilization |

---

## 5) Milestones de pacing validés

| Fenêtre | Diagnostic post-pass |
|---|---|
| L1–L5 | **Hook rapide**: upgrades courts, premiers choix (Mine/Quarry/Housing/Warehouse) visibles tôt |
| L6–L10 | **Pression lisible**: stockage + pop + prérequis croisés empêchent le “rush mono-axe” |
| L11–L15 | **Planning réel**: dépendances support (warehouse/research/market/intel) deviennent structurantes |
| L16–L20 | **Engagement long** sans cliff artificiel: long-term commitment, mais pente temps plus régulière |

---

## 6) Viabilité d’archétypes de ville

- **Éco city**: Housing + Warehouse + Mine/Quarry/Refinery hauts, armée modérée.
- **Military city**: Barracks/Forge/Dock + Academy/Factory, économie locale suffisante mais non maxée.
- **Mixed city**: possible mais sous pression pop/stockage; nécessite ordre de montée propre.

Conclusion: les trois archétypes restent viables, sans stratégie dominante unique évidente dans les tables de coût/temps/pop actuelles.

---

## 7) Provisoire explicite (avant lock final)

Restent provisoires (playtests + arbitrage produit):
- coefficients précis combat (offense/defense/structure) par unité,
- conversion exacte des effets doctrine/policy en moteur runtime,
- tuning fin des multiplicateurs late L16–L20 après premiers playtests multi-villes.

# Space Dock Units — référence runtime Coinage vs Grepolis Naval Units

Date: 2026-04-22
Scope: unités `requiredBuildingId === 'space_dock'`.

## 1) Source of truth
- Runtime/config: `CITY_ECONOMY_CONFIG.troops`
- Liste exhaustive réelle:
  - assault_dropship
  - swift_carrier
  - interceptor_sentinel
  - ember_drifter
  - rapid_escort
  - bulwark_trireme
  - colonization_arkship

Mapping Grepolis retenu:
- assault_dropship -> Transport Boat
- swift_carrier -> Fast Transport Ship
- interceptor_sentinel -> Bireme
- ember_drifter -> Fire Ship
- rapid_escort -> Light Ship
- bulwark_trireme -> Trireme
- colonization_arkship -> Colony Ship

## 2) Tableau global récapitulatif
| id technique | nom affiché | équivalent Grepolis | requiredBuildingLevel | requiredResearch | coûts (ore/stone/iron) | temps | population | navalAttack | navalDefense | speed | transportCapacity | statut visuel | verdict gameplay | verdict visuel | correction appliquée / à faire |
|---|---|---|---:|---|---|---:|---:|---:|---:|---:|---:|---|---|---|---|
| assault_dropship | Strike Dropship | Transport Boat | 1 | none | 500/500/400 | 9600 | 7 | 0 | 0 | 8 | 26 | MISSING | OK | MISSING | research corrigée |
| swift_carrier | Rapid Carrier | Fast Transport Ship | 1 | light_transport_ships | 800/0/400 | 7200 | 5 | 0 | 0 | 15 | 10 | MISSING | OK | MISSING | aucun |
| interceptor_sentinel | Sentinel Interceptor | Bireme | 1 | bireme | 800/700/180 | 9900 | 8 | 24 | 160 | 15 | 0 | MISSING | OK | MISSING | navalDefense explicite corrigé |
| ember_drifter | Ember Frigate | Fire Ship | 1 | fire_ship | 500/750/150 | 4000 | 8 | 0 | 0 | 5 | 0 | MISSING | OK | MISSING | research corrigée |
| rapid_escort | Vanguard Corvette | Light Ship | 1 | light_ship | 1300/300/800 | 14400 | 10 | 200 | 60 | 13 | 60 | MISSING | OK | MISSING | research + navalDefense corrigés |
| bulwark_trireme | Bulwark Cruiser | Trireme | 1 | trireme | 2000/1300/1300 | 14400 | 16 | 250 | 250 | 15 | 0 | MISSING | OK | MISSING | navalDefense explicite corrigé |
| colonization_arkship | Colony Ark | Colony Ship | 10 | colony_ship | 10000/10000/10000 | 57535 | 170 | 0 | 300 | 3 | 0 | MISSING | OK | MISSING | navalDefense explicite corrigé |

## 3) Section détaillée unité par unité
### assault_dropship
- Vérité code-grounded: transport pur, pas d’attaque navale.
- Comparaison Grepolis: mapping Transport Boat confirmé.
- Mismatch trouvé: recherche d’unlock (corrigée à none).
- Corrections appliquées: `requiredResearch=null`.
- Verdict final: OK.

### swift_carrier
- Vérité code-grounded: transport rapide, unlock research `light_transport_ships`.
- Comparaison Grepolis: mapping Fast Transport Ship confirmé.
- Mismatch: aucun objectif.
- Verdict final: OK.

### interceptor_sentinel
- Vérité code-grounded: unité défensive navale.
- Comparaison Grepolis: Bireme (attaque 24, défense navale élevée).
- Mismatch trouvé: défense navale non explicite auparavant.
- Correction appliquée: `navalDefense=160`.
- Verdict final: OK.

### ember_drifter
- Vérité code-grounded: fire ship (attaque navale 0, rôle spécial).
- Comparaison Grepolis: Fire Ship confirmé.
- Mismatch trouvé: mapping research inversé.
- Correction appliquée: `requiredResearch='fire_ship'`.
- Verdict final: OK.

### rapid_escort
- Vérité code-grounded: light ship offensif.
- Comparaison Grepolis: Light Ship confirmé.
- Mismatchs trouvés: research inversée + défense navale non explicite.
- Corrections appliquées: `requiredResearch='light_ship'`, `navalDefense=60`.
- Verdict final: OK.

### bulwark_trireme
- Vérité code-grounded: navire lourd.
- Comparaison Grepolis: Trireme.
- Mismatch trouvé: défense navale non explicite.
- Correction appliquée: `navalDefense=250`.
- Verdict final: OK.

### colonization_arkship
- Vérité code-grounded: ship colonisation (Harbor level 10 + research).
- Comparaison Grepolis: Colony Ship.
- Mismatch trouvé: défense navale non explicite.
- Correction appliquée: `navalDefense=300`.
- Verdict final: OK.

## 4) Constats transverses
- Unlock research: aligné après corrections.
- Unlock building level: aligné.
- Coûts / temps: cohérents avec la base Coinage Grepolis-like (times de base Harbor + modificateurs runtime).
- Stats navales: désormais explicites (`navalAttack`, `navalDefense`).
- Transport capacity: champ canonique conservé (`transportCapacity`), pas de redondance `booty`.
- Runtime branché:
  - branché: guards, coûts, temps, queue, résolution, trainingSpeed,
  - non branché: simulation complète de combat naval/pillage (à ce stade du runtime).
- Visuels: mapping unitaire absent en UI (`MISSING`).

## 5) Plan P0 / P1 / P2
- P0 (fait): correction unlocks + stats navales explicites + tests.
- P1: brancher usages battle/naval de `navalAttack/navalDefense` quand le moteur naval est activé.
- P2: brancher visuels unitaires dédiés (si assets disponibles).

## 6) Verdict final du lot unités Space Dock
**PARTIAL**
- Données runtime/config: OK après correction.
- Couverture visuelle dédiée: MISSING.

## Sources
Principales:
- https://wiki.en.grepolis.com/wiki/Harbor
- https://wiki.en.grepolis.com/wiki/Naval_Units

Complément officiel (arbitrage si ambigu):
- https://support.innogames.com/kb/Grepolis/en_DK/3404/Transport-Boat
- https://support.innogames.com/kb/Grepolis/en_DK/3407/Bireme
- https://support.innogames.com/kb/Grepolis/en_DK/3410/Light-Ship
- https://support.innogames.com/kb/Grepolis/en_DK/3413/Fire-Ship
- https://support.innogames.com/kb/Grepolis/en_DK/3416/Fast-Transport-Ship
- https://support.innogames.com/kb/Grepolis/en_DK/3419/Trireme
- https://support.innogames.com/kb/Grepolis/en_DK/3422/Colony-Ship

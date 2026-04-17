# Troupes & Formation — Core non-premium (Global pass v1)

> Source of truth runtime: `src/game/city/economy/cityEconomyConfig.ts`.
> Source of truth full-core: `src/game/city/economy/cityContentCatalog.ts`.

## 1) Périmètre unités en scope

- Infantry
- Shield Guard
- Marksman
- Raider Cavalry
- Assault
- Breacher
- Interception Sentinel
- Rapid Escort
- Assault Convoy
- Siege Runner
- Colonization Convoy

Aucune unité premium/prestige n’est réintroduite.

---

## 2) Table unités (post-pass global)

| Unité | Unlock | Coût (Ore/Stone/Iron) | Temps | Pop | Vitesse | Rôle |
|---|---|---:|---:|---:|---|---|
| Infantry | Barracks 1 | 28 / 20 / 0 | 20s | 1 | medium | Ligne low-cost d’ouverture |
| Shield Guard | Barracks 5 | 58 / 50 / 12 | 40s | 2 | slow | Ancre défensive |
| Marksman | Barracks 10 | 82 / 52 / 34 | 50s | 2 | medium | DPS plasma backline |
| Raider Cavalry | Barracks 15 | 122 / 86 / 54 | 70s | 3 | very_fast | Raid / pression mobilité |
| Assault | Combat Forge 1 | 145 / 108 / 90 | 85s | 3 | medium | Ligne offensive avancée |
| Breacher | Combat Forge 8 | 210 / 180 / 135 | 115s | 4 | very_slow | Percée / anti-structure |
| Interception Sentinel | Space Dock 1 | 178 / 132 / 130 | 95s | 3 | very_fast | Interception projection |
| Rapid Escort | Space Dock 5 | 235 / 170 / 170 | 120s | 3 | fast | Escorte et écran mobile |
| Assault Convoy* | Space Dock 10 | 300 / 235 / 210 | 170s | 7 | slow | Transport d’assaut (cap 12 pop) |
| Siege Runner* | Space Dock 15 | 330 / 275 / 240 | 205s | 6 | very_slow | Siège mobile anti-structure |
| Colonization Convoy* | Space Dock 20 + HQ 10 | 520 / 420 / 360 | 300s | 12 | extreme_slow | Colonisation (consommé à l’arrivée) |

\* `Assault Convoy`, `Siege Runner`, `Colonization Convoy` sont catalogués et balancés mais restent `partially_defined` tant que les boucles runtime complètes (projection/colonisation) ne sont pas lockées produit.

---

## 3) Ajustements de design appliqués

### 3.1 Pression population rétablie

- Pop costs augmentés sur les lignes médianes/avancées (Marksman, Raider, Assault, Breacher, Rapid Escort).
- Objectif: empêcher les armées “gratuites en pop” et rendre `Housing Complex` + choix d’archétype structurants.

### 3.2 Pacing d’entraînement

- Temps de formation augmentés sur unités avancées pour différencier:
  - spam de ligne légère,
  - production d’élite,
  - projection lourde.

### 3.3 Logistique explicite

- `Assault Convoy`: capacité portée à **12 pop** (au lieu de 10), mais coût/temps/pop plus lourds.
- `Siege Runner`: lent et cher, dégâts structure élevés, impose escorte.
- `Colonization Convoy`: extrême lenteur, très coûteux, consommé à la prise de territoire.

---

## 4) Validation des archétypes ville (côté armée)

- **Éco city**: compose surtout Infantry/Shield + défenses bâtiment, projection limitée.
- **Military city**: absorbe coûts pop élevés et temps longs sur lignes Assault/Breacher + air/projection.
- **Mixed city**: possible via armée plus compacte et rotations de production ciblées.

---

## 5) Points encore provisoires avant numeric lock final

- stats de combat fines (coeffs absolus offense/defense/structure),
- calibrage exact des multiplicateurs doctrine/policy avec Academy/Council,
- tuning de cadence de projection multi-villes en conditions réelles (playtests).

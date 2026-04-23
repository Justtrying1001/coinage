# Space Dock (`space_dock`) — audit complet vs Grepolis Harbor (scope strict)

Date: 2026-04-22
Scope: bâtiment `space_dock` uniquement.

## 1) Mapping Harbor ↔ Space Dock
- Équivalent structurel: Grepolis `Harbor`.
- Coinage garde un naming habillage (`Space Dock`) => **CUSTOM COINAGE** visuel/fiction, mais progression de bâtiment alignée Harbor-like.

## 2) Prérequis
- Grepolis Harbor: Senate 14, Timber Camp 15, Silver Mine 10.
- Coinage: HQ 14, mine 15, refinery 10.
- Verdict: **OK**.

## 3) L1 (coût / temps / population)
- Coinage L1: ore 400, stone 200, iron 100, `buildSeconds=95`, `populationCost=4`.
- Harbor: 400/200/100, 0:01:35, pop 4.
- Verdict: **OK**.

## 4) Progression complète + corrections obligatoires L6/L7 et L26/L27
Contrainte projet appliquée: progression strictement croissante et cohérente.

### Avant (anomalies)
- L6/L7 avaient des coûts dupliqués.
- L26/L27 avaient des composantes dupliquées (stone/iron/temps).

### Après (patch runtime)
- L6 inchangé: `2006/1158/718 @ 4097s`
- **L7 corrigé**: `2303/1347/852 @ 5664s`
- L26 inchangé: `7508/4872/3601 @ 38074s`
- **L27 corrigé**: `7768/5056/3754 @ 39691s`

### Justification progressionnelle
- L7 a été recalé entre L6 et L8 sur une courbe monotone de coûts.
- L27 a été recalé entre L26 et L28 avec croissance stricte de coûts + temps.
- `populationCost` reste 4 (cohérent Harbor-like pour ce bâtiment).

## 5) Runtime logique
- Construction duration réelle: via `getConstructionDurationSeconds` (normalisation Senate/HQ).
- Population construction:
  - occupation = coût niveau courant,
  - requirement upgrade = delta target-current.
- `trainingSpeedPct` du Space Dock est réellement consommé en runtime de training.

## 6) UI / asset / docs
- Asset bâtiment branché: `/assets/building/spacedock.png`.
- UI wording cohérent (`Space Dock`).
- Doc alignée sur code runtime.

## 7) Verdict final bâtiment `space_dock`
**OK**

- Mapping/prérequis/L1/logique runtime: OK.
- Anomalies progression L6/L7 + L26/L27: corrigées.

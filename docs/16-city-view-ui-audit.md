# CityView (`city3d`) UI Audit — Runtime Grounded (2026-04-17)

## État actuel (avant refonte)

- `CityFoundationMode` monte une UI DOM custom dans le host `CoinageRenderApp` via le mode system (`galaxy2d` / `planet3d` / `city3d`).
- Refresh: polling UI toutes les ~1s (`update`) + relecture persistence (`loadCityEconomyState`) puis rerender partiel.
- Runtime hooks déjà dispo côté micro:
  - bâtiments + unlocks + queue construction,
  - training troupes,
  - research queue/completed,
  - intel projects/readiness,
  - policies gouvernance,
  - derived stats locaux.

## Problèmes constatés

1. Hiérarchie UX faible: stage ville pas assez "scène centrale", rendu proche d’un dashboard.
2. Panneau contexte trop empilé (plusieurs blocs permanents), manque de contextualisation par branche.
3. Styles `globals.css` avec dette legacy city (beaucoup de classes historiques / ambiguës).
4. Identité premium sci-fi incomplète: profondeur visuelle limitée, lecture opérationnelle perfectible.
5. Tests CityView existants surtout orientés non-régression de base; couverture structurelle UX premium insuffisante.

## Cible de refonte

- Top command bar persistante (identité + resources + queues + nav).
- Rail micro sections clair: economy/military/defense/research/intelligence/governance/logistics.
- Scène centrale immersive avec hotspots spatialisés des bâtiments par district.
- Panneau contextuel unique, adaptatif à la branche active (training/research/intel/policies/effets locaux).
- Aucun premium/wallet/special actif dans l’UX micro.

## Fichiers à toucher

- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css` (bloc CityView moderne + cleanup progressif)
- `src/game/render/modes/CityFoundationMode.test.ts`
- Docs CityView/micro scope:
  - `docs/15-city-view-terrain-runtime-audit.md` (cross-link)
  - `docs/03-Gameplay-Micro.md`
  - `docs/07-Roadmap-Build.md`

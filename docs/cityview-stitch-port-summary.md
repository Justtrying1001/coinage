# Cityview Stitch Port Summary

## 1) What was changed
- Corrected city information architecture so **building management lives on Command/Home only**.
- Reworked branch pages into functional views:
  - Economy: production/caps/throughput and economic infrastructure links
  - Military: troop training management
  - Defense: defense metrics and defensive structures
  - Research: research list/queue management
  - Intelligence: intel operations/readiness
  - Governance: policy management
  - Market: exchange-focused page with explicit unavailable state for non-implemented runtime trade action
- Removed invalid branch concepts (no token branch, no logistics branch).
- Kept Stitch shell structure as the single mounted city shell: top bar, left nav, central content, right context panel, bottom strip.
- Preserved canonical asset sourcing via `/assets/:file` backed by root `assets/` files.

## 2) Files changed
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.test.ts`
- `src/components/game/GameShell.tsx`
- `docs/cityview-stitch-port-audit.md`
- `docs/cityview-stitch-port-summary.md`
- `src/app/assets/[file]/route.ts`

## 3) Branch/page map
- Command / Home / City Overview
- Economy
- Military
- Defense
- Research
- Intelligence
- Governance
- Market

## 4) Runtime wiring
Fully wired:
- Building upgrades (command page workflow)
- Troop training
- Research start
- Intel project start
- Governance policy set
- Real resources/production/population/storage/queues/timers/derived stats

Partially passive (explicitly unavailable, non-fake):
- Market exchange action execution (page structure present, action marked unavailable)
- Defense branch-specific non-building ops beyond existing runtime hooks

## 5) Layout/readability fixes
- Removed dual-top-bar overlap by hiding global `GameShell` header during city mode.
- Ensured city host is cleared before Stitch shell mount.
- Improved nav label wrapping and overflow behavior.
- Added operational list/grid primitives for branch pages to avoid clipped/overflowing text.
- Improved right panel block spacing and bottom strip readability.

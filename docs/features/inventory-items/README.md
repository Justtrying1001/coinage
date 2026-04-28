# Coinage Inventory & Bonus Items (Grepolis-inspired) — Product/Design Overview

## 1) Purpose
This documentation defines a **future** Inventory + Bonus Items system for Coinage, inspired by Grepolis, without changing current runtime/gameplay behavior.

> **Status**: Documentation only (no runtime implementation in this deliverable).

## 2) Scope and Intent
- Provide an unambiguous design baseline for future implementation.
- Separate clearly:
  - **Existing in Coinage now** (current truth)
  - **Proposed system**
  - **MVP scope**
  - **Post-MVP scope**
  - **Future NFT/on-chain dependency**

## 3) Current State (What exists today)
### Existing (from current docs/tracker)
- Coinage has city economy, research, units, espionage MVP, and broader MVP systems still in progress.
- A global player inventory with itemized bonus usage is **not implemented**.
- Marketplace/trading as a full product feature is still pending in MVP tracker.

### Non-existing today (explicit)
- No runtime inventory slots system.
- No runtime item template/instance lifecycle.
- No runtime item usage validation engine.
- No runtime NFT mint/list/use/burn pipeline.

## 4) Grepolis Inspiration vs Coinage Adaptation
### Grepolis-inspired patterns kept
- Inventory slots and capacity friction.
- Reward-driven item acquisition (quests/events/rewards).
- Deferred-use consumables and temporary boosts.
- City-targeted usage and contextual application.
- Event-specific temporary inventory.

### Coinage adaptations
- Sci-fi theming (colonies/planets/fleets).
- PvP always-on constraints and anti-last-second abuse rules.
- Seasonal/server segmentation (season-bound/server-bound items).
- Premium currency path with shards.
- NFT-ready item instance model and marketplace lock semantics.

## 5) Design Principles
1. **Server gameplay truth first** (off-chain authoritative state for resolution).
2. **Exploit resistance over convenience** (strict locks, caps, cooldowns, logs).
3. **Controlled monetization** (avoid pay-to-win runaway).
4. **Deterministic item lifecycle** (create/acquire/use/expire/list/burn).
5. **MVP off-chain first, NFT later** (phase rollout to reduce risk).

## 6) Deliverables Map
- `01-system-design.md`: complete game/system rules.
- `02-item-catalog.md`: proposed item families and item sheets.
- `03-nft-item-economy.md`: NFT lifecycle, trust model, anti-fraud.
- `04-technical-design-proposal.md`: future architecture proposal (no code).
- `05-ui-ux-flows.md`: UX flows and validation interactions.
- `06-mvp-scope-and-roadmap.md`: phased rollout and reduced MVP catalog.

## 7) MVP vs Post-MVP Summary
### MVP (proposed)
- Off-chain inventory + item templates/instances.
- Small curated set of low-risk consumables.
- Server-side use validation and audit logs.
- Basic marketplace lock semantics (even if marketplace itself is delayed/limited).

### Post-MVP (proposed)
- Full tradable catalog expansion.
- Permanent module items and advanced effects.
- Full NFT mint/burn/transfer and integrated marketplace.
- Cross-season policy and rarity governance automation.

## 8) Decision Log Snapshot
- **Decision (Proposed)**: gameplay effect resolution remains server authoritative even when NFT exists.
- **Decision (Proposed)**: consumable tradable NFT items must be burned/invalidated at use.
- **Open Question**: on-chain sync pattern (synchronous write-through vs async reconciliation).
- **Open Question**: final legal/ops constraints for player-to-player item trading by region.

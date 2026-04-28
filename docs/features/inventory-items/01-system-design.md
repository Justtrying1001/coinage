# 01 — Inventory & Bonus Items System Design (Proposed)

## 1) Scope
This document defines the **proposed** runtime behavior for a future inventory/items feature. It does not change existing gameplay now.

## 2) Domain Boundaries
- **Inventory Domain**: ownership, storage, stack rules, expiry, locks.
- **Item Effect Domain**: use validation, target resolution, effect activation/expiration.
- **Economy Domain**: acquisition channels, rarity, caps, anti-P2W rails.
- **Marketplace Domain**: listing/delisting/trade locks.
- **NFT Bridge Domain**: mapping between game item instance and tokenized representation.

## 3) Inventory Model

### 3.1 Player Main Inventory
- Fixed base slots + unlockable temporary overflow.
- Slot pressure intentionally creates strategic choices.
- Expired items still visible in "Expired" segment for limited audit window.

**Proposed defaults (tunable)**
| Parameter | Proposed | Notes |
|---|---:|---|
| Base slots | 30 | MVP starter capacity |
| Soft overflow slots | +10 | Time-limited from events/rewards |
| Max hard cap | 60 | Anti-hoarding/perf guard |

### 3.2 Event Temporary Inventory
- Separate partition for event-only items.
- Auto-expire at event end or grace window end.
- Optional auto-convert to fallback reward if unused.

### 3.3 Slot and Stacking Policy
- Stackable only when same `template_id + binding + expiry bucket + tradability + provenance policy`.
- High-value/NFT-candidate items default non-stackable (instance-unique).

## 4) Item Classes
- **Consumable instant**: one-shot effect, consumed on success.
- **Consumable timed**: activates timed buff/debuff state.
- **Permanent module**: installable persistent city modifier (rare, post-MVP heavy governance).
- **Container/crate**: opens into one or multiple generated items.

## 5) Tradability and Binding
- `tradable`: can be listed/transferred.
- `non_tradable`: inventory-locked.
- `soulbound`: permanently account-bound.
- `server_bound`: usable only on origin server.
- `season_bound`: expires or locks outside season.

## 6) Usage Rules

### 6.1 Global Use Preconditions
- Item owned by requester.
- Not listed on marketplace.
- Not locked by another transaction.
- Not expired.
- Not already consumed.
- Binding constraints satisfied (server/season/account).

### 6.2 Targeting Rules
Each item declares allowed targets:
- `city`
- `queue: construction | recruitment | research | shipyard`
- `fleet`
- `global player scope`

Use payload must include explicit target context.

### 6.3 Queue Edge Cases
- **Queue near completion**: minimum remaining duration threshold for speed-up application.
- If below threshold, apply partial value or reject by policy.

**Proposed (MVP conservative)**
- Reject use when remaining queue time < 60 sec for time-skip items.

### 6.4 Incoming Attack Rules (critical anti-abuse)
- Shield/protection items: blocked if inbound hostile attack exists or within pre-impact lock window.
- Defense buffs: blocked inside pre-impact lock window.

**Proposed lock windows**
| Effect Type | Proposed lock window |
|---|---|
| Shield/Peace bubble | Disallow if any incoming hostile attack; plus 15 min after last hostile launch toward city |
| Defense boost | Disallow if closest hostile ETA ≤ 10 min |
| Attack boost | Allowed only for fleets not already in final approach state |

### 6.5 City/Fleet No Longer Exists
- If target city/fleet deleted/invalid at commit:
  - transaction fails atomically;
  - item remains unused;
  - lock released.

### 6.6 Expiration Rules
- Expired consumables cannot be used.
- Expired active effects terminate at expiry timestamp.
- Expired crates cannot be opened unless explicit grace policy exists.

### 6.7 Listed Item Rule
- Listing creates hard `market_lock`.
- Locked items cannot be consumed/equipped/opened.
- Delisting must clear lock before any use attempt.

## 7) Anti-Abuse Framework

### 7.1 Abuse Vectors & Mitigations
| Risk | Mitigation (Proposed) |
|---|---|
| Whale speed-up spam | Daily/weekly consumption caps by effect family + diminishing returns optional |
| Last-second combat abuse | Pre-impact lock windows on shield/defense items |
| Multi-account farming | Provenance flags + trade cooldown + suspicious transfer graph monitoring |
| Free reward resale | default non-tradable for selected reward channels |
| Listed-and-used race | server transaction lock + listing state check at commit |
| Used-then-resold | immutable consumed state + transfer block |
| Server reset imbalance | server-bound + season-bound policies |
| Bot farming events | event participation validation + anti-bot scoring + delayed tradability |

### 7.2 Hard Safeguards
- Idempotent use endpoint with request key.
- Single-writer lock per item instance.
- Audit log for acquire/list/delist/use/expire/transfer.
- Fraud review flags for outlier velocity and transfer patterns.

## 8) MVP vs Post-MVP
### MVP
- Consumables and timed buffs only.
- No permanent installable modules in phase 1.
- Conservative tradability (most rewards non-tradable).

### Post-MVP
- Permanent modules with uninstall constraints.
- Wider tradable catalog.
- Deeper alliance/server-level item interactions.

## 9) Open Questions
- Final cap values by server speed/profile.
- Whether partial-consume for near-complete queues is desirable.
- Whether anti-spy shields should block all intel or only selected mission classes.

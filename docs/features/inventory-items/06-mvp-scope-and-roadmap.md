# 06 — MVP Scope and Roadmap (Proposed)

## 1) Delivery Philosophy
- Stage complexity gradually.
- Validate anti-abuse before broad monetization/trading.
- Keep gameplay fairness guardrails ahead of NFT expansion.

## 2) Phase Plan

## Phase 0 — Documentation only
- Produce complete product/design/technical docs.
- Align product, economy, backend, anti-fraud stakeholders.

## Phase 1 — Off-chain inventory foundation (no NFT)
- Item templates + item instances.
- Player inventory slots and expiry handling.
- Basic item acquisition hooks (manual grants/admin/event stubs).

## Phase 2 — Server item usage engine
- Use validations, targeting rules, anti-abuse windows.
- Active effect records and effect expiry.
- Full item action audit logging.

## Phase 3 — Rewards/events integration
- Event inventory segment.
- Reward crates and controlled drops.
- Non-tradable defaults for most free/event rewards.

## Phase 4 — Marketplace off-chain or semi-off-chain
- Listing/delisting/transfer states.
- Lock semantics between inventory and marketplace.
- Abuse monitoring on transfer graph.

## Phase 5 — NFT mint/burn/transfer
- Token mapping for selected item families.
- Burn/invalidations on consumable use.
- Reconciliation and incident runbook.

## Phase 6 — Full marketplace integration
- End-to-end NFT-aware trading UX.
- Policy automation by season/server.
- Governance-driven rarity and cap management.

## 3) MVP Starter Item Set (Recommended)
1. `itm_build_skip_5m`
2. `itm_build_skip_30m`
3. `itm_recruit_skip_1h`
4. `itm_res_boost_20_6h`
5. `itm_def_boost_20_6h`
6. `itm_anti_spy_shield_6h`
7. `itm_storage_overflow_small_12h`
8. `itm_event_crate_small`

## 4) Why these are good MVP choices
- Cover core loops (build, recruit, resource, defense, intel, rewards).
- Easy for players to understand and test.
- Provide monetization levers without immediate full NFT complexity.
- Offer strong telemetry for balancing before expansion.

## 5) Explicit Out-of-Scope for MVP
- Permanent installable modules.
- Full shield ecosystem for all war states.
- Broad tradable high-power catalog.
- Cross-server import/export mechanics.

## 6) KPI/Telemetry Suggestions
- Item grant/use rate by source.
- Conversion from reward -> use.
- Waste rate (expired unused items).
- Combat-impact item usage timing distribution.
- Transfer concentration (anti-whale/anti-farm signal).

## 7) Risk Register (Top)
| Risk | Severity | MVP Mitigation |
|---|---|---|
| P2W perception spike | High | conservative tradability + usage caps |
| Last-second combat abuse | High | attack-window locks |
| Item farming by bots | High | reward eligibility checks + delayed tradability |
| State divergence off-chain/on-chain | High | start off-chain-first + reconciliation before scale |
| Design over-complexity | Medium | narrow MVP catalog |

## 8) Go/No-Go Gates per Phase
- **Gate A (after phase 2):** no critical dupes/races in use transaction logs.
- **Gate B (after phase 3):** reward economy stable across cohort test.
- **Gate C (after phase 4):** transfer abuse rates under threshold.
- **Gate D (after phase 5):** reconciliation SLA and failure recovery validated.

## 9) Open Questions
- Which regions/servers should run first pilot?
- Should defense buff and anti-spy be enabled same day in MVP or staggered?
- What is acceptable cap for purchasable speed-up consumption per day?

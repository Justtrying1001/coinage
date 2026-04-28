# 04 — Technical Design Proposal (Documentation Only)

> This is a future architecture proposal. No migrations/APIs/runtime code are introduced here.

## 1) Architecture Goals
- Deterministic item lifecycle.
- Strong anti-duplication and idempotent operations.
- Clear separation between template definitions and instance ownership state.
- MVP off-chain first; NFT bridge introduced progressively.

## 2) Proposed Domain Types (Pseudo-model)

```text
ItemTemplate
- templateId
- family
- rarity
- effectType
- effectParams (json)
- targetTypes[]
- defaultTradable
- defaultBindings
- stackPolicy
- maxStack
- expiryPolicy
- status (active/deprecated)

ItemInstance
- itemInstanceId
- templateId
- ownerPlayerId
- quantity (for stackable)
- state (available/locked/listed/consumed/expired)
- bindings (soulbound/server/season)
- originChannel
- acquiredAt
- expiresAt
- listedAt
- consumedAt
- version

ActiveItemEffect
- effectInstanceId
- sourceItemInstanceId
- ownerPlayerId
- targetType
- targetId
- startedAt
- endsAt
- status (active/expired/cancelled)

ItemActionLog
- actionId
- itemInstanceId
- actionType
- actorPlayerId
- requestIdempotencyKey
- payloadHash
- result
- createdAt
```

## 3) Proposed Data Tables (Conceptual)
| Table (Proposed) | Purpose | Key Constraints |
|---|---|---|
| `item_templates` | static config templates | unique `template_id` |
| `item_instances` | ownership + lifecycle | unique `item_instance_id`, index on `owner_player_id,state` |
| `inventory_slots` | capacity model by player | unique `(player_id, slot_index)` |
| `item_locks` | transactional locks | unique active lock per `item_instance_id` |
| `market_listings` | listing state | unique active listing per `item_instance_id` |
| `item_effect_records` | active/expired effects | index on `owner_player_id,target_id,status` |
| `item_action_logs` | immutable audit trail | unique `request_idempotency_key` per action scope |
| `item_nft_links` | off-chain to on-chain mapping | unique `(chain_id, contract, token_id)` |

## 4) Item Templates vs Item Instances
- Template defines behavior and constraints.
- Instance carries ownership/state/binding/provenance.
- Balance patching should generally alter templates for future grants, not retroactively mutate instance history.

## 5) Ownership and Inventory Slots
- Inventory slot records can be explicit rows or computed capacity + ordering field.
- Overflow bucket recommended for temporary rewards/events.
- Slot occupancy should be validated server-side at grant time.

## 6) Item Locks and Marketplace State
- Introduce lock reasons: `use_pending`, `market_listed`, `transfer_pending`, `fraud_review`.
- Use action requires lock acquisition; lock released on terminal success/failure.
- Marketplace listing sets `market_listed` lock and `state=listed`.

## 7) Use Transaction Flow (Proposed)
1. Validate idempotency key.
2. Load and lock item instance.
3. Verify ownership + not listed + not expired + not consumed.
4. Validate target and anti-abuse windows.
5. Apply effect atomically.
6. Consume/decrement item.
7. Persist action log.
8. Emit domain event for analytics and optional chain sync.

## 8) Server Validations (Mandatory)
- Target exists and belongs to allowed scope.
- Queue compatibility and remaining-time thresholds.
- Attack timing windows for combat-sensitive items.
- Effect stacking limits and active cap limits.
- Binding constraints (`server_bound`, `season_bound`, `soulbound`).

## 9) Security / Anti-Duplication
- Optimistic concurrency (`version`) or row-level lock.
- Idempotency key required for all state-changing actions.
- Signed server events for marketplace and chain bridge consumers.
- Periodic invariant checks (listed+consumed impossible state detector).

## 10) Rollback and On-chain Failure Handling
- Prefer gameplay commit first, chain action second only where safe.
- If chain burn/transfer fails after gameplay commit:
  - mark `chain_sync_pending`;
  - enforce non-usable/non-tradable lock until resolved;
  - reconciliation worker retries with bounded policy.

## 11) Future API Surface (Proposed only)
- `GET /inventory`
- `POST /items/use`
- `POST /items/list`
- `POST /items/delist`
- `POST /items/open-crate`
- `GET /items/active-effects`

> Endpoint list is documentary only; not a request to implement now.

## 12) MVP Off-chain vs Future NFT Mode
### MVP Off-chain
- `item_nft_links` optional/unused.
- Marketplace can be off-chain/internal ledger.

### Future NFT
- Enable token mapping and chain event reconciliation.
- Strict use/list/transfer lock coupling with chain states.

## 13) Implementation Readiness Checklist
- [ ] Validate data model with economy + backend + anti-fraud stakeholders.
- [ ] Define exact idempotency scope and TTL.
- [ ] Confirm server tick integration for timed effects expiration.
- [ ] Define operations runbook for reconciliation incidents.

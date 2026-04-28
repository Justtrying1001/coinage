# 03 — NFT Item Economy Design (Proposed)

## 1) Why NFT-ready Items in Coinage
- Enable provable ownership and secondary trading for selected high-value items.
- Support collectible/prestige layers without forcing core gameplay to be fully on-chain.
- Open long-term interoperability while preserving server authoritative gameplay.

## 2) What should be NFT vs not NFT

### Strong NFT candidates
- High-value tradable consumables (limited editions, seasonal rares).
- Prestige/cosmetic collectibles.
- Permanent modules (if governance/risk controls are mature).

### Prefer non-NFT (or delayed NFT)
- High-volume low-value boosts used constantly in MVP.
- Anti-abuse-sensitive free event rewards.
- Experimental items under active balance iteration.

## 3) Lifecycle of an NFT-backed Item Instance
1. **Mint / creation** (on-chain and mirrored off-chain metadata reference).
2. **Acquisition** (reward/shop/market transfer).
3. **Inventory storage** (server inventory record with ownership + lock state).
4. **Marketplace listing** (hard lock gameplay use).
5. **Delisting** (unlock after confirmed delist state).
6. **Trade transfer** (ownership update off-chain + chain transfer reconciliation).
7. **Use request** (server validation first).
8. **Burn / invalidate / lock** depending item class.
9. **Post-use record** (auditable immutable usage trail).

## 4) Consumable NFT vs Permanent NFT

### Consumable NFT
- On successful use: burn token or irrevocably mark as consumed/non-transferable.
- Must not remain resellable after use.

### Permanent NFT
- Remains valid after install/use, but may be non-transferable while installed.
- Uninstall (if allowed) should have cooldown/fee/constraints.

## 5) Recommended Metadata Schema (high level)
- `template_id`
- `instance_id`
- `rarity`
- `effect_family`
- `binding` (`soulbound/server_bound/season_bound`)
- `season_id`, `server_id`
- `origin_channel` (event/shop/market/reward)
- `tradability_policy`
- `expiry_at`
- `consumable`
- `use_constraints_hash` (optional integrity anchor)

## 6) Source of Truth and Data Authority
**Decision (Proposed)**: gameplay truth remains server-side.
- On-chain state is ownership/provenance layer.
- Server decides if use is legal by current game state (combat, queue, target validity).
- Chain confirmation does not override illegal gameplay usage.

## 7) Off-chain DB ↔ On-chain NFT Relationship
- Every tokenized item maps to exactly one server item instance.
- Server maintains lifecycle and lock states.
- Reconciliation jobs detect drift (ownership mismatch, stale listing, failed burn).

## 8) Fraud & Double-Spend Risks
| Risk | Proposed Control |
|---|---|
| Off-chain used while still transferable on-chain | Pre-use lock + immediate consume pipeline + async verifier |
| Listed and used race | Listing hard lock checked at commit + optimistic concurrency |
| Duplicate mint reference | Unique `(chain_id, contract, token_id)` constraint in DB |
| Cross-system replay | Idempotency keys + nonce per item action |
| Use after transfer | Verify latest owner snapshot at action commit |

## 9) Season / Server Constraints
- High-power items default `season_bound` and/or `server_bound`.
- End-of-season: convert, archive, or lock based on policy.
- No import of power items into fresh servers unless explicit migration policy allows.

## 10) Pay-to-Win Guardrails
- Limit purchasable combat-impact items per period.
- Keep core progression mostly skill/time/strategy driven.
- Separate cosmetic monetization from power monetization where possible.
- Free/event reward tracks should remain meaningful.

## 11) Limits on Purchasable/Resellable Items
- Some reward channels forced `non_tradable`.
- Tradability unlock delay for newly acquired items (anti-flip/anti-bot).
- Caps on active combat buffs regardless of wallet size.

## 12) MVP vs Post-MVP
### MVP
- Off-chain item system with NFT compatibility fields.
- Optional pilot NFT for cosmetic/prestige only.

### Post-MVP
- Full mint/burn/transfer flow for selected functional items.
- Marketplace settlement and robust reconciliation infrastructure.

## 13) Open Questions
- Jurisdiction/compliance constraints for marketplace monetization.
- Custodial vs non-custodial wallet UX trade-offs.
- Gas sponsorship policy for burn/use transactions.

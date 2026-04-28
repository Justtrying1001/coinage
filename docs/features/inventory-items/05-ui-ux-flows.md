# 05 — UI/UX Flows (Proposed)

## 1) UX Principles
1. Prevent wrong-target usage.
2. Expose tradability and binding status clearly.
3. Explain lock reasons (listed, expired, ineligible target, incoming attack).
4. Reduce accidental spend via explicit confirmation.

## 2) Core Screens
- Inventory home (tabs: All, Usable, Tradable, Active Effects, Expired, Event).
- Item detail modal/drawer.
- Target selection modal.
- Use confirmation modal.
- Active effects panel per city and global.
- Marketplace listing flow entry from item detail.

## 3) Critical UX Rule (Mandatory)
Before confirming use, the player must clearly see:

> **"This item will be applied to: [City / Queue / Fleet / Research]"**

Must include explicit entity name/ID (example: `City: Nova Prime`, `Queue: Construction`, `Fleet: Vanguard-12`).

## 4) Flow: Open Inventory
1. Player opens inventory from HUD.
2. Default tab = Usable.
3. Show slot occupancy and overflow timer if active.

## 5) Flow: Browse and Filter
Filters:
- Category family.
- Rarity.
- Tradable vs non-tradable.
- Usable on current city (contextual quick filter).
- Expiring soon.

## 6) Flow: View Item Detail
Detail panel shows:
- Effect summary.
- Duration/expiry.
- Tradability + binding badges.
- Usability status with reason codes.
- Marketplace status (listed/not listed/lock reason).

## 7) Flow: Use Item (with target selection)
1. Click `Use`.
2. If multiple target candidates, open target picker.
3. Show pre-validation summary.
4. Show mandatory statement:
   - "This item will be applied to: ..."
5. Confirm use.
6. Display success/failure with explicit result.

## 8) Wrong Target Prevention
- Current city mismatch warning before confirm.
- If city changes while modal open, force revalidation.
- Highlight non-eligible targets disabled with reason tooltip.

## 9) Active Effects and Expired Items
- Active effects shown by remaining time and target.
- Expired items moved to Expired tab with timestamp.
- Optional one-click cleanup for expired non-recoverable items.

## 10) Marketplace Flows
### List item
1. From detail, click `List on Marketplace`.
2. Confirm tradability and policy checks.
3. Item enters listed state + gameplay lock.

### Remove listing
1. Click `Delist` from listing panel.
2. Confirm delist.
3. Lock removed after successful state update.

### Buy item
1. Buyer confirms listing purchase.
2. Ownership transfer success screen.
3. Item appears in buyer inventory with post-trade cooldown badge if applicable.

### Use purchased item
- Use flow identical to normal flow, with all validations.

## 11) Event Inventory Temporary Flow
- Event tab separate from main inventory.
- Countdown badge for event end/grace end.
- Expiry behavior preview shown before player confirms actions.

## 12) Error State Catalogue (for UX copy)
- `ERR_ITEM_LISTED_LOCK`
- `ERR_ITEM_EXPIRED`
- `ERR_TARGET_INVALID`
- `ERR_ATTACK_WINDOW_LOCK`
- `ERR_BINDING_MISMATCH`
- `ERR_INVENTORY_FULL`
- `ERR_ALREADY_CONSUMED`

## 13) MVP vs Post-MVP UX
### MVP
- Inventory browse/use with core filters.
- Essential lock/error messaging.
- Active effects panel basic.

### Post-MVP
- Full marketplace UI integration.
- Advanced compare and optimizer suggestions.
- NFT provenance view in item detail.

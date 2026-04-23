# Runtime Structure Asset Mapping

This mapping is constrained to **runtime-implemented economy structures/buildings** (`EconomyBuildingId`) and their real usage surfaces in the current code.

## Legend

- **Needed now** = assets required for readability in currently shipping UI surfaces.
- **Optional future** = richness/polish that does not block current UX.
- **Status**
  - `safe-now`: can start production immediately.
  - `blocked`: should wait for runtime integration changes.

## Structure mapping table

| Internal key | Canonical display name | Current UI surfaces using it | Visual asset types needed now | Optional future asset types | Needed now status | Blocked/safe-now | `public/assets/iso` coverage note | Existing runtime asset note |
|---|---|---|---|---|---|---|---|---|
| `hq` | HQ | Command building card, economy tile, detail panel context | card visual (PNG), tile visual (PNG) | list icon, world tile sprite | yes | safe-now | No `public/assets/iso` file exists to map. | Currently points to `/assets/HQ.png`. |
| `mine` | Mine | Command building card, economy tile, economy/building intel list | card visual, tile visual | list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/stone.png` (shared with quarry). |
| `quarry` | Quarry | Command building card, economy tile, economy/building intel list | card visual, tile visual | list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/stone.png` (shared with mine). |
| `refinery` | Refinery | Command building card, economy tile, economy/building intel list | card visual, tile visual | list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/refeniry.png` (typo filename). |
| `warehouse` | Warehouse | Command building card, economy tile, market infrastructure list | card visual, tile visual | list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/warehouse.png`. |
| `housing_complex` | Housing Complex | Command building card, economy tile | card visual, tile visual | list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/housing.png`. |
| `barracks` | Barracks | Command building card, military support structures list | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/barrack.png`. |
| `space_dock` | Space Dock | Command building card, military support structures list | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/spacedock.png`. |
| `defensive_wall` | Defensive Wall | Command building card, defense structures list | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/walls.png`. |
| `skyshield_battery` | Skyshield Battery | Command building card, defense structures list | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/watchtower.png`. |
| `armament_factory` | Armament Factory | Command building card, military support structures list | **card visual (missing now)** | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | **No runtime image mapping currently; falls back to `No Art`.** |
| `intelligence_center` | Intelligence Center | Command building card, intelligence/detail contexts | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/building/spycenter.png`. |
| `research_lab` | Research Lab | Command building card, research/detail contexts | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/researchlabs.png`. |
| `market` | Market | Command building card, market infrastructure list | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/market.png`. |
| `council_chamber` | Council Chamber | Command building card, governance/detail contexts | card visual | tile visual, list icon, world tile sprite | yes | safe-now | No iso coverage in repo. | Currently points to `/assets/councill.png` (typo filename). |

---

## Runtime usage notes (important for production)

1. **All 15 economy buildings are runtime-defined and surfaced in city UI.**
2. Current image consumption is primarily:
   - command cards (`city-stitch__card-image`)
   - economy tiles (`city-stitch__tile-media`) for economy subset.
3. Building link rows are text-only today (no icon slot), so list-icon production is optional (P1).
4. A dedicated city-canvas building sprite system is not currently wired to these economy buildings, so world-tile sprite production is optional and can be deferred.

---

## Existing iso asset coverage assessment

There is no iso asset corpus under `public/assets/iso` (or equivalent repo path) to map against runtime building keys.

| Check | Result |
|---|---|
| `public/assets/iso/*` exists | No |
| any `/assets/iso` runtime references | No |
| reusable iso files found for runtime buildings | None |
| recommendation | Do not wait on iso reuse; proceed with direct building card/tile production under canonical naming. |

---

## Immediate production recommendation (P0)

Produce now for all structures:

- `cg_building_{id}_card_256.png`
- `cg_building_{id}_tile_256.png` (required now for economy subset, but safe to batch for all ids)

Highest-risk gap to close first:

1. `armament_factory` missing card art.
2. `mine`/`quarry` currently sharing same art (readability issue).
3. Filename normalization for typo legacy files (`refeniry`, `councill`) to canonical build keys.

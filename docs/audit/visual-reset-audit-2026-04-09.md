# Coinage Visual Reset Audit — 2026-04-09

## 1) Legacy audit (found active old model)

### Legacy files tied to old world model
- `app/galaxy/page.tsx`
- `app/planet/[planetId]/page.tsx`
- `app/validation/[planetId]/page.tsx`
- `src/ui/galaxy/*`
- `src/ui/planet/*`
- `src/rendering/planet/*`
- `src/rendering/space/create-starfield.ts`
- `src/vendor/xenoverse/*`
- `src/domain/world/*` files tied to planet/galaxy identity and generation

### Coupling points
- App routing was centered on galaxy + planet pages.
- World domain naming and constants were planet-oriented.
- Rendering pipeline relied on dedicated planet renderer paths.
- UI shells/HUD were tied to galaxy/planet mental model.

### Deletion decision
All modules above were removed to prevent hybrid behavior and guarantee a hard reset.

## 2) Grepolis UX memo (structure-only inspiration)

References:
- Interface article (World View / Island View / City View structure).
- City Overview article (city as detailed management surface).

Transposable principles to Coinage:
1. Three-layer navigation hierarchy:
   - macro world navigation
   - local territorial layer
   - city management layer
2. Fast context switches between these layers.
3. Information density adapted to scope (global vs local vs micro-management).

Coinage-specific differences retained:
- Sectorized persistent world (not island grid replication).
- Token/faction territorial control as primary abstraction.
- Faction view modeled as sector-local operational layer (slots/cities/control states).

## 3) Canonical view definition selected

### View Map
Macro reading of clusters/territories/conflicts with pan/zoom and sector selection.

### View Faction
Canonical intermediate local layer:
- bound to a selected sector
- shows city slots, occupied/free state, local tactical actions
- bridges Map -> City

### View Ville
Detailed city management:
resources, buildings, production/recruitment, status.

## 4) Notes
- Current world content is mock data to establish UX structure.
- Backend integration points are explicit in world model types and shell state.

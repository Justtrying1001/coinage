# Coinage — Map View Canonical Spec

## 1. Role of the Map View
Map View is the primary game surface. It is where players read the world, evaluate distance and distribution, and orient all territorial decisions.

## 2. Structural Comparison
Canonical equivalence:
- Factions = Grepolis islands (structural role)
- Digital ocean = Grepolis sea (structural role)
- City slots visible directly on faction-islands
- Spatial reading first, UI panel reading second

Coinage changes art direction, not this structural logic.

## 3. What Must Be Visible on the Map
Map View must clearly show:
- Faction-islands as spatial masses
- City slots on each faction-island
- Readable free vs occupied slot state
- World distribution: clusters, voids, and distance relationships
- A navigable horizontal/spatial world frame

No free zoom is required in this main world view.

## 4. Faction-Island Shape Rules
Faction-islands must be:
- Organic
- Irregular
- Distributed across multiple size classes
- Built from multiple silhouette families
- Readable at distance
- Non-repetitive in profile

Forbidden shape outcomes:
- Uniform repetition
- Perfect circles
- Clean geometric blobs
- Node-like markers

## 5. World Composition Rules
World composition must enforce:
- Cluster presence
- Meaningful empty spaces
- Density variation
- Clear perception of map scale
- Strategic legibility at first glance

Void is not wasted space; it is part of strategic reading.

## 6. Digital Ocean Rules
Digital ocean must be:
- Dark, subtle, and alive
- Supportive of spatial depth
- Low-noise by default

Digital ocean must not be:
- Overloaded with decorative effects
- A visual distraction from islands and slots
- Treated as pure background wallpaper without spatial function

## 7. Slot Placement Rules
City slot placement on faction-islands must:
- Be spatially readable
- Maintain enough separation for quick parsing
- Preserve enough clarity at map scale
- Support future occupied/free interpretation
- Avoid random chaos
- Avoid rigid spreadsheet regularity

Slots should feel embedded in territory structure, not pinned on top as foreign UI.

## 8. Interaction Rules
Map View interaction baseline:
- **Hover**: local highlight/readability reinforcement
- **Select**: establish active faction-island focus
- **Click**: deliberate entry toward Faction View
- **Transition**: preserve spatial continuity from Map to Faction view

Interaction must reinforce geographic understanding, not replace it with modal UI behavior.

## 9. Launch Constraints
At launch, all factions are neutral. Therefore first milestone priorities are:
- Map readability
- Faction-island silhouette quality
- Slot structure clarity
- World composition and navigation clarity

Heavy ownership-state visual systems are not required for this milestone.

## 10. Anti-Patterns
Forbidden directions for Map View:
- Dashboardized world map layout
- Node-graph/protocol-style topology
- Card-based island representation
- Excess FX obscuring silhouettes and slots
- Uniform island templates that destroy territorial identity
- Interaction models that break Map → Faction continuity

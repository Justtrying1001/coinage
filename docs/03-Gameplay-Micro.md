# COINAGE — Gameplay MICRO (MVP)

## Scope

MVP MICRO is now the **full city loop** with all standard non-special buildings.

### Included standard buildings
- Economy/logistics: `hq`, `mine`, `quarry`, `refinery`, `warehouse`, `housing_complex`, `market`
- Military: `barracks`, `combat_forge`, `space_dock`, `military_academy`, `armament_factory`
- Defense: `defensive_wall`, `watch_tower`
- Research/intel/governance: `research_lab`, `intelligence_center`, `council_chamber`

### Deferred
- `training_grounds`, `shard_vault`, premium/special/wonder branches.

## City-level systems active in MVP MICRO

1. Resource production (claim-on-access): ore/stone/iron.
2. Storage and population constraints.
3. Construction queue (F2P slots only, premium queue disabled).
4. Troop training queue and unlocks.
5. Local defense stats (defense/mitigation/siege resistance).
6. Local city-based research points spend + completed research effects (instant completion, no timer queue).
7. Local intelligence readiness and intel projects.
8. Local governance policies via council chamber.
9. Local market/logistics modifiers.

## CityView UX (city3d)

The active city interface is a command-deck layout:
- persistent top command bar (identity/resources/queues/nav),
- micro branch rail on the left,
- central immersive city stage with spatial building hotspots,
- single right contextual operations panel adapting to selected building + branch.

Premium/wallet/special interactions are intentionally absent from active CityView.

## Macro note

World-map projection, cross-city warfare, colonization effects, token-world effects, and inter-faction governance are intentionally deferred to the MACRO pass.

# MVP Gameplay Audit — Coinage (MICRO reset)

## Scope decision (active)

The old assumption “MVP = economy-only / 6 buildings” is obsolete.

### Active MVP MICRO perimeter
All **standard non-special** buildings are active:
- `hq`, `mine`, `quarry`, `refinery`, `warehouse`, `housing_complex`
- `barracks`, `combat_forge`, `space_dock`, `defensive_wall`, `watch_tower`
- `military_academy`, `armament_factory`, `intelligence_center`, `research_lab`, `market`, `council_chamber`

### Deferred perimeter
- `training_grounds`
- `shard_vault`
- wonders / unique / endgame / premium-only buildings

## MVP MICRO gameplay systems (required in runtime)

1. Construction/upgrade loop for all 17 standard buildings.
2. Troop training queue and unit unlocks via military branch.
3. Local defense derivation (wall/tower effects).
4. Local research queue/projects with persistent completion state.
5. Local intelligence readiness/projects with persistent state.
6. Local governance policy selection with persistent city-level effects.
7. Local market/logistics modifiers active at city level.

## Explicitly out of scope in this pass

- Wallet auth, holding validation, premium unlock logic.
- MACRO simulation: world projection, inter-city warfare/capture, colonization resolution, inter-faction governance.

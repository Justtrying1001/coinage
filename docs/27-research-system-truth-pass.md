# Research system truth pass (Grepolis alignment, full branch set)

## Grepolis truths verified (official support)
- Research is city-local.
- Research consumes resources + research points.
- Academy gives 4 RP per level.
- Library gives +12 RP.
- Research tree entries have academy-level requirements and RP costs.
- Research reset exists in Grepolis (Agora/culture-point flow).

Primary sources:
- https://support.innogames.com/kb/Grepolis/en_DK/3503/Research-Tree
- https://support.innogames.com/kb/Grepolis/en_DK/3506/Researching
- https://support.innogames.com/kb/Grepolis/en_DK/3299
- https://support.innogames.com/kb/Grepolis/en_DK/3317
- https://support.innogames.com/kb/Grepolis/en_DK/607/How-do-I-obtain-research-points
- https://support.innogames.com/kb/Grepolis/en_DK/369/What-happens-if-my-academy-loses-a-level

## What this pass implements in Coinage
- Full research branch set from the Grepolis tree as runtime research IDs/config entries.
- City-level RP spending model (instant completion, no arbitrary timer queue).
- Legacy Coinage research IDs migrated to new branch IDs in persistence loading.
- Troop unlock gating rewired to concrete branch research IDs.

## Adaptation notes
- Coinage keeps `research_lab` naming as Academy-equivalent progression structure.
- Library +12 RP and reset via culture point remain documented truths; dedicated runtime primitives for those systems are still pending.

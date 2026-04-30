# Overview

Coinage is a strategy game centered on economic and military progression, structured around **Galaxy → Planet → City** navigation. The current runtime already supports a playable city loop (economy, construction, training, research), while advanced systems are still partial (full combat loop, complete colonization).

## Navigation loop
- **Galaxy**: scan planets and select a target.
- **Planet**: inspect local context and expansion potential.
- **City**: manage resources, buildings, queues, and progression.

## Progression loop (runtime)
1. Produce `ore`, `stone`, and `iron`.
2. Upgrade economic buildings (Mine/Quarry/Refinery/Warehouse).
3. Keep construction and training queues running.
4. Unlock research to improve production, defense, and training speed.
5. Progress toward advanced branches (space dock, intel, colonization).

## Implemented vs planned
### Implemented runtime
- Passive timestamp-based production, storage, construction queue, training queue, research queue.
- Building/research prerequisites enforced.
- Local policies and baseline intel/espionage systems.

### Partial / in progress
- Macro combat (full resolver not proven in this repository).
- Inter-planet colonization loop (foundation exists, full loop partial).
- Global transactional market (not demonstrated end-to-end).

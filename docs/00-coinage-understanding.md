# Coinage — Project Understanding Audit

## 1. Executive Summary

Coinage is documented as a **persistent MMO strategy game** where each token maps to one faction and each active holder controls one city. The game is structured around territorial expansion, conflict, diplomacy, and seasonal competition on a sectorized 2D world map. The docs position it as a continuity model (long-running world + seasonal resets) rather than a match-based game.

From the documentation, Coinage appears to be a **macro-micro strategy hybrid**:
- micro layer: city economy, population tension, troops, spying, and research
- macro layer: faction governance, branch progression, collective military power, diplomacy, and wars
- world layer: neutral sectors, territorial control, conquest thresholds, and end-of-season victory conditions

The core player fantasy seems to be:
1. build and specialize cities effectively,
2. contribute to faction-level power,
3. project military force across the map,
4. win meaningful territorial conflicts,
5. leave long-term seasonal legacy (titles/reputation/history).

The project goal is not to reinvent strategic rules, but to preserve a tested strategic loop while moving it onto a token/faction model, a seeded sectorized world map, and a darker premium presentation aligned with military command-center aesthetics.

## 2. Core Game Pillars

Based on recurring signals across docs, the main pillars are:

1. **Persistent territorial strategy**  
   The world is always on, sectors begin neutral, and faction expansion happens through colonization/capture over time.

2. **Factional cooperation over solo progression**  
   Individual city optimization matters, but major outcomes are collective: branch progression, treasury spending, wars, diplomacy, and territorial control.

3. **Three-layer gameplay loop (city → faction → world)**  
   Player decisions cascade from local city choices to faction outcomes to map-level geopolitical changes.

4. **Distance/projection as strategic friction**  
   Movement time, convoy vulnerability, and multi-wave timing are central constraints; power is not purely numeric, it is logistical.

5. **Political meta-game as core content**  
   Elections, council roles, alliances, treaties, and official war declarations indicate politics is first-class gameplay, not side flavor.

6. **Seasonal competition with historical persistence**  
   Servers reset economically/politically each season, but title/reputation/history carry forward.

7. **Fairness boundary (non-pay-to-win)**  
   Monetization is constrained to convenience/comfort/cosmetics, with explicit exclusion of direct raw power purchases.

## 3. Core World / Structure

### 3.1 World shape and initialization
- World is a **2D sectorized map** generated from `WORLD_SEED`.
- Launch starts with approximately 500 sectors (configurable).
- All sectors start neutral; no faction is pre-placed.
- Sector clusters are described as natural (no rigid grid).

### 3.2 Entities and territorial logic
- **Faction**: all players tied to a token.
- **Player**: one city per player.
- **Sector**: territorial map unit, with slot capacity varying by seed.
- **Neutral sector**: no faction control.
- **Core/home territory**: first sector assigned when a token’s first player arrives.
- **Controlled territory**: sector fully held by one faction.

### 3.3 Territorial states and transitions
- Neutral → Core when first faction activation claims sector.
- Neutral → Controlled when all sector slots belong to one faction.
- Controlled → Neutral immediately if one slot is retaken by another faction in official war.

### 3.4 Macro/micro hierarchy
**Hierarchy reconstructed from docs:**
1. **World layer (macro geopolitical frame)**: sectors, wars, alliances, seasonal victory.
2. **Faction layer (collective strategy/governance layer)**: branches, treasury, elected council, collective army.
3. **City layer (micro execution layer)**: resources, buildings, troops, espionage, research, trading.

This implies city optimization is necessary but insufficient; map outcomes are decided by faction-level coordination and territorial control.

## 4. Intended Navigation Model

> Note: the repository docs do not provide an explicit UX IA spec naming “Map View / Faction View / City View” as screens, but the gameplay model strongly implies this exact 3-view structure.

### 4.1 Map View (macro world view)
**Purpose**
- Primary strategic canvas: territorial states, sector ownership, conflict zones, cluster geography, and distance-based projection context.

**Likely player actions (implied by mechanics)**
- select sectors/cities,
- inspect control status and war relevance,
- launch/monitor cross-sector movements,
- assess expansion opportunities and frontline pressure.

**Information density**
- Broad and comparative: ownership/state overlays, movement vectors, strategic chokepoints, and diplomatic/conflict context.

**Relation to other views**
- Entry point into local operational contexts (Faction View and City View).
- Should remain the “game surface,” not just a navigation wrapper.

### 4.2 Faction View (local territorial/organizational view)
**Purpose**
- Operational command layer for collective progression and political decisions.

**Likely player actions**
- monitor faction branches and treasury,
- participate in governance/votes,
- review war state and alliance posture,
- coordinate collective priorities and contributions.

**Information density**
- Medium to high, but structured around collective systems (governance + macro progression + strategic posture), not individual building minutiae.

**Relation to other views**
- Bridges world strategy (Map View) and individual execution (City View).
- Converts macro intent into player contribution targets.

### 4.3 City View (internal city management view)
**Purpose**
- Detailed management of one player’s city economy/military/research pipeline.

**Likely player actions**
- build/upgrade structures,
- train units,
- allocate research,
- manage population tradeoffs,
- launch spy/trade/logistics actions.

**Information density**
- High local detail; tactical and transactional.

**Relation to other views**
- Produces the assets and capabilities used in Faction and Map outcomes.
- City specialization supports broader faction strategy.

## 5. Visual / Artistic Direction

### 5.1 What is defined in current docs
- Technical docs establish **Three.js-based world map visualization** and repeatedly stress map readability/cluster clarity.
- Product framing emphasizes world map centrality and strategic readability.

### 5.2 What is implied by provided project framing (this audit request)
- Desired direction is dark, premium, techno, military-command-center, “Ultron”-like.
- Navigation philosophy should mirror Grepolis macro→local→city structure, but not its artistic identity.

### 5.3 What should be explicitly avoided
From the request framing and map-centric constraints:
- dashboard-like panels as primary experience,
- generic enterprise card stacks as dominant visual grammar,
- node-graph look substituting for spatial world comprehension,
- any composition where the map feels secondary to UI chrome.

### 5.4 Coinage vs typical web dashboard (target distinction)
A dashboard optimizes for widgets and KPI panels; Coinage should optimize for **spatial strategy perception**:
- geography first, panels second,
- tactical movement context first, metric readouts second,
- ownership/frontline legibility first, “app shell” patterns second.

## 6. Gameplay / Systems Mentioned in Docs

Below is a strict extraction of systems explicitly present in docs.

1. **City resource economy** (defined)
   - Continuous claim-on-access production for Ore/Stone/Iron (+Shards cap logic).
   - Storage caps halt passive accumulation when full.

2. **Population-cap tension model** (defined)
   - Buildings and living troops both consume population.
   - Housing Complex is core cap source; specialization emerges from allocation tradeoffs.

3. **Building progression and unlock tree** (defined)
   - HQ gating, level caps, prerequisites, queue slots, premium queue expansion.

4. **Unit production and military composition** (defined)
   - Line units and projection units, with unlock levels and role distinctions.

5. **Combat model with typed attacks/defenses** (partially defined)
   - Three attack families (cinetic/energetic/plasma), two-phase combat flow.
   - Detailed numeric formulas for full battle resolution are not fully specified.

6. **Projection logistics and convoy dependence** (defined)
   - Travel-time model based on slowest unit.
   - Assault/colonization convoy timing and escort constraints are central.

7. **Colonization and siege capture flow** (defined)
   - Instability window (12h) and convoy arrival requirement for capture.

8. **Territory fall threshold (75%)** (defined)
   - Territory flips when 75% of its cities are captured by one enemy faction.

9. **Anti-abuse combat protections** (defined but tunable)
   - New player shield, post-raid protection, morale modifier vs bully behavior.

10. **Espionage economy and vault mechanic** (defined)
    - Spy actions consume Iron from dedicated vault; offense/defense comparison decides outcome.

11. **Individual research capacity system (RC)** (partially defined)
    - RC reservation model and branches are defined.
    - Complete tech tree content/costs/effects are not in these docs.

12. **Inter-city trading/logistics** (partially defined)
    - Market and convoy movement are defined conceptually.
    - No detailed market rules (rates/taxes/caps) are documented.

13. **Faction branches progression (Economic/Military/Diplomatic)** (partially defined)
    - 20 tiers each; one branch progresses at a time.
    - Full tier-by-tier effects not fully enumerated here.

14. **Faction governance and voting** (defined)
    - Council size, role responsibilities, decision thresholds, war/peace approval logic.

15. **Official wars and conflict lifecycle** (defined)
    - Prerequisites, declaration process, conflict objectives, end conditions, reward categories.

16. **Alliances and diplomacy framework** (partially defined)
    - Alliance constraints/effects/rupture behavior present.
    - Full treaty ontology and edge-case rules remain underspecified.

17. **On-chain influenced modifiers** (partially defined)
    - Cohesion/retention/conversion impact military and signal progression.
    - Exact ingestion windows/anti-manipulation rules are not fully detailed.

18. **Seasonal endgame (monuments + reset)** (defined at high level)
    - 7 monuments; first alliance to complete 4 wins server.
    - Seasonal reset/persistence boundaries specified conceptually.

19. **Monetization model (non-P2W)** (defined principle)
    - Premium queue/convenience/cosmetics; strict ban on direct raw power purchase.

## 7. Technical / Product Constraints Found in Docs

### 7.1 Stack and infra constraints
- Frontend: Next.js App Router + TypeScript.
- UI baseline: Tailwind CSS.
- World visualization: Three.js for sectorized 2D map.
- DB: Neon PostgreSQL.
- ORM: Prisma version pinned to 5.22.0.
- Jobs: Upstash QStash.
- Deploy target: Vercel.

### 7.2 Data and domain modeling signals
- Core entities include User, City, Faction, Sector, War, Alliance, TroopMovement, SpyMission.
- Sector status lifecycle (`NEUTRAL`, `CORE`, `CONTROLLED`) is explicitly modeled.
- On-chain pipeline snapshots feed faction signal and are frozen during active conflict windows.

### 7.3 Transactional consistency rules (high-signal)
- Serializable transactions for critical resource mutations.
- Mandatory bounded arithmetic (`min` for gains, `max` for spend).
- Explicit prohibition of blind ORM increments/decrements on critical resources.

### 7.4 Product constraints and priorities
- Preserve core game rules while changing map/world model.
- Early roadmap prioritizes resource stability, capture reliability, map readability, snapshot robustness, anti-abuse tooling.
- MVP deliberately excludes full war/governance/endgame to validate core loop first.

## 8. Canonical Design Signals

1. **The world map is the strategic backbone, not a cosmetic layer.**
2. **All sectors start neutral; control must be earned via colonization/capture.**
3. **Core loop is city execution in service of faction-level outcomes.**
4. **Projection logistics (distance, convoy, timing) is a defining mechanic.**
5. **Governance/diplomacy are gameplay systems, not social extras.**
6. **Official war is gated and procedural, not always-on free-for-all.**
7. **Seasonal reset + legacy persistence defines long-term meta.**
8. **Monetization must not sell raw combat/economic power directly.**
9. **Resource mutations demand strict transactional safety.**
10. **Map readability and spatial clarity are technical priorities.**

## 9. Ambiguities / Missing Definitions / Open Questions

### 9.1 Gameplay ambiguities
- Full combat math is incomplete (damage formulas, target selection priorities, variance, casualty resolution details).
- Some unit references are inconsistent across docs (e.g., line-unit unlock labels around scout/marksman/shield naming progression).
- Research system describes RC mechanics and branches, but lacks a canonical full tech catalog.
- Trading is conceptually present, but pricing/exchange/transport limits and anti-exploit rules are unclear.
- Monument phase is described, but trigger condition (“world maturity”) is not operationally defined.

### 9.2 World structure ambiguities
- Sector generation is seeded, but clustering algorithm, biome/topology constraints, and distance metric specifics are not documented.
- Sector slot range (50–300) is broad; distribution profile and balancing rationale are undefined.
- Multi-token “camp choice” in war is mentioned but participant/state model is not explicit.

### 9.3 Visual direction ambiguities
- Current repo docs contain limited explicit art direction language; most DA constraints come from external framing (this task prompt), not from canonical project docs.
- No concrete visual design spec exists for the three views (camera grammar, typography system, panel density, interaction states, color semantics).
- No explicit canonical anti-pattern library (“what not to ship visually”) exists in-repo.

### 9.4 Technical architecture ambiguities
- Three.js usage is stated, but no rendering architecture (scene graph strategy, instancing model, LOD policy, interaction picking pipeline) is documented.
- No formal event model for simulation tick boundaries vs claim-on-access updates vs war snapshots.
- On-chain integration defines indicators conceptually, but data validation/oracle trust boundaries and failure behavior remain unclear.
- No explicit performance SLOs (map FPS targets, query latency budgets, concurrency assumptions).

### 9.5 Contradiction flags (to resolve explicitly)
- Some descriptions say “mécanique inchangée” while introducing materially new framing (token-faction/on-chain/signal effects). The boundary between “unchanged legacy rules” and “new systemic modifiers” should be formalized.
- Military branch mentions unlocking conquest 75% at certain tier, while elsewhere 75% appears as a general core rule; gating vs baseline availability needs one canonical source.

## 10. Recommended Next Documentation Steps

1. **Canonical Visual Direction Spec (single source of truth)**
   - mood, palette, typography, depth/lighting language, interaction tone, anti-patterns to avoid dashboard drift.

2. **Three-View Navigation & UX Architecture Doc**
   - Map/Faction/City responsibilities, transition rules, information contracts, persistent/global HUD principles.

3. **Map Rendering Architecture Doc**
   - sector rendering strategy, clustering visualization, movement overlays, picking/selection, performance budgets.

4. **Combat Resolution Spec (deterministic rules)**
   - exact formulas, phase order, targeting, randomness policy, casualty and loot resolution, replay/log format.

5. **Faction Governance & Diplomacy Protocol Spec**
   - precise state machines for votes, roles, war declarations, alliances, treaties, surrender, and edge cases.

6. **On-chain Data Contract & Integrity Spec**
   - source definitions, snapshot cadence, anti-manipulation safeguards, fallback behavior, auditability requirements.

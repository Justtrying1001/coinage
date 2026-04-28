# 02 — Proposed Item Catalog (Coinage)

> All values below are **Proposed** and non-final.

## 1) Catalog Governance Notes
- Item IDs are proposed naming conventions.
- Balance values are placeholders for tuning.
- Tradability is policy-dependent and may vary by acquisition source.

## 2) Construction Speed-Ups

| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_build_skip_5m` | Nano Constructor Burst (5m) | Construction speed-up | Common | -5m on active construction queue | Instant | City construction queue | Yes | Yes | Limited | Burn on use | MVP | Medium (spam) | Enforce per-day cap |
| `itm_build_skip_30m` | Nano Constructor Burst (30m) | Construction speed-up | Rare | -30m on active construction queue | Instant | City construction queue | Yes | Yes | Tradable (policy) | Burn on use | MVP | High | Pre-impact independent but queue checks required |

## 3) Recruitment Speed-Ups
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_recruit_skip_1h` | Barracks Acceleration Protocol (1h) | Recruitment speed-up | Rare | -1h on barracks queue | Instant | City barracks queue | Yes | Yes | Limited | Burn on use | MVP | High | Daily cap + minimum remaining time guard |

## 4) Research Speed-Ups
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_research_skip_30m` | Lab Quantum Optimizer (30m) | Research speed-up | Rare | -30m on active research | Instant | City research queue | Yes | Yes | Limited | Burn on use | Post-MVP | Medium | Ensure one active research invariant |

## 5) Shipyard / Fleet Production Speed-Ups
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_shipyard_skip_30m` | Orbital Drydock Rush (30m) | Fleet production speed-up | Rare | -30m on shipyard queue | Instant | Space dock queue | Yes | Yes | Limited | Burn on use | Post-MVP | High | Naval pacing sensitivity |

## 6) Resource Production Boosts
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_res_boost_20_6h` | Planetary Yield Amplifier | Resource boost | Uncommon | +20% all primary resource production | 6h | City/global city context | No (refresh) | Yes | Limited | Burn on use | MVP | Medium | Cap concurrent economic buffs |

## 7) Storage / Warehouse Boosts
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_storage_overflow_small_12h` | Emergency Silo Buffer (Small) | Storage boost | Uncommon | +X temporary overflow storage | 12h | City warehouse | No | Yes | Non-tradable by default | Burn on use | MVP | Low | Define overflow decay behavior |

## 8) Defense Boosts
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_def_boost_20_6h` | Aegis Harmonic Grid | Defense boost | Rare | +20% city defense | 6h | City | No | Yes | Limited | Burn on use | MVP | High (combat timing) | Disallow near hostile ETA |

## 9) Attack Boosts
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_atk_boost_15_3h` | Warhead Calibration Uplink | Attack boost | Rare | +15% attack for outgoing troops/fleets | 3h | Fleet or city launch context | No | Yes | Tradable controlled | Burn on use | Post-MVP | High | Anti-snowball cap by day |

## 10) Espionage / Counter-Espionage
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_anti_spy_shield_6h` | Ghost Lattice Veil | Counter-espionage | Rare | Blocks/penalizes hostile intel ops | 6h | City | No | Yes | Non-tradable default | Burn on use | MVP | High | Must define mission classes blocked |

## 11) Travel / Fleet Movement Boosts
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_travel_boost_20_2h` | Slipstream Navigator | Travel boost | Epic | +20% fleet speed | 2h | Fleet | No | Yes | Tradable limited | Burn on use | Post-MVP | High | Combat arrival abuse safeguards |

## 12) Protection / Shield Items
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_city_shield_8h` | Civilian Protection Dome | Shield | Epic | Prevents hostile attacks/actions (policy-scoped) | 8h | City | No | Yes | Non-tradable default | Burn on use | Post-MVP | Very high | Hard lock: cannot activate with inbound attacks |

## 13) Queue Extension Items
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_queue_ext_build_slot_24h` | Auxiliary Construction AI | Queue extension | Rare | +1 temporary construction queue slot | 24h | City build queue | No | Yes | Limited | Burn on use | Post-MVP | Medium | Requires queue concurrency rules |

## 14) Event-Only Items
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_event_crate_small` | Event Reward Crate (Small) | Event-only | Variable | Grants weighted random rewards | N/A | Inventory | Yes | Yes (on open) | Non-tradable default | Open -> spawn child items | MVP | Medium | Anti-farm + anti-bot protections |

## 15) Permanent City Modules
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_module_orbital_forge_mk1` | Orbital Forge Module Mk1 | Permanent module | Legendary | Permanent +5% construction speed in one city | Permanent | City module slot | No | No | Tradable restricted | NFT persistent, optional uninstall token | Post-MVP | Very high | Season-bound strongly recommended |

## 16) General / High Command Related (Future)
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_hc_order_haste_2h` | High Command Tactical Surge | High Command | Epic | +X command efficiency in general system | 2h | General/command scope | No | Yes | TBD | Burn on use | Post-MVP | High | Depends on future war_council/high_command system |

## 17) Cosmetic / Prestige
| Proposed Item ID | Name | Category | Rarity | Effect (Proposed) | Duration | Target | Stackable | Consumable | Tradable | NFT Behavior | MVP/Post-MVP | Balance Risk | Implementation Note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `itm_cos_city_skin_neon_01` | Neon Citadel Skin | Cosmetic | Rare | City visual skin only | Permanent unlock | Account/city cosmetic layer | No | No | Tradable optional | NFT collectible, non-gameplay | Post-MVP | Low | Keep gameplay-neutral |

## 18) Recommended MVP Starter Set
- `itm_build_skip_5m`
- `itm_build_skip_30m`
- `itm_recruit_skip_1h`
- `itm_res_boost_20_6h`
- `itm_def_boost_20_6h`
- `itm_anti_spy_shield_6h`
- `itm_storage_overflow_small_12h`
- `itm_event_crate_small`

## 19) Open Questions
- Final tradability matrix per acquisition source.
- Whether research/fleet speed-ups should enter MVP or wait for post-MVP.
- Exact anti-spy behavior against each espionage mission type.

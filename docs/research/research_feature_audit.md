# Research Feature Audit

## Executive summary
- Le runtime research (queue, guards, completion, persistence) est en place et stable.
- Les unlocks unitaires et la branche espionnage/intel sont globalement bien branchés.
- Les effets production/build/training ont des consommateurs gameplay explicites.
- Les effets defense/anti-air/market sont majoritairement en agrégation de stats, avec consommation gameplay partielle.
- `conquest` est déclarée mais la feature mère de conquête/colonisation n'est pas branchée dans le runtime audité.
- `cartography` et `recovery_logistics` présentent un écart potentiel entre intention design probable et consommation runtime actuelle.

## What is fully correct today
- FULLY_WIRED: railgun_skirmisher, assault_ranger, bulwark_trooper, diplomacy, meteorology, espionage, workforce_loyalty, raider_interceptor, architecture, trainer, sentinel_interceptor, crane, shipwright, aegis_walker, vanguard_corvette, ember_frigate, siege_artillery, cryptography, rapid_carrier, plow, bulwark_cruiser, offensive_tempo, mathematics, workforce_morale

## What is partially wired
- PARTIALLY_WIRED: city_guard, market_logistics, ceramics, colony_ark, conscription, democracy, bunks, defense_formation, fortification_breach, anti_air_defense, command_selection, veteran_training, naval_mobilization

## What is declared but not implemented
- DECLARED_BUT_FEATURE_NOT_IMPLEMENTED: conquest

## What is potentially in the wrong effect bucket
- `cartography`: classée feature unlock dans la description, mais effet runtime déclaré/consommé en `marketEfficiencyPct` + prereq chain.
- `recovery_logistics`: libellé logistique mais effet runtime limité à `marketEfficiencyPct` agrégé.

## What is potentially design-drifted
- `anti_air_defense`: bonus anti-air présent en agrégation/stat snapshot, sans résolution anti-air dédiée prouvée dans ce scope.
- `defensePct` researches: contribution à `cityDefensePct` agrégé, sans moteur de combat global connecté ici.

## Tree coherence audit
- Branches cohérentes: unit unlocks, espionage/intel, production/build/training.
- Branches suspectes: market/logistics/navigation/conquest (consommation système partielle ou absente).
- Prereq chains à surveiller: `rapid_carrier -> cartography -> conquest -> recovery_logistics`.

## Runtime truth vs design truth
- Aligné: queue timed, guards, RP capacity/spend, unlocks unitaires, gates espionnage/intel.
- Partiellement aligné: defense/anti-air/market effects.
- Non aligné: promesse système `conquest` vs absence de consumer runtime dédié.

## MVP impact
- Safe MVP: research core loop, unit unlock gating, espionage/intel gating.
- À clarifier: wording/design intent sur cartography/recovery_logistics.
- Peut attendre: intégration complète des consumers market/anti-air selon roadmap système.
- Risque si laissé tel quel: confusion design/doc sur ce que certaines recherches apportent réellement.

## Top priority follow-ups
- P0: clarifier explicitement `conquest` comme dépendante d'une feature mère non implémentée.
- P1: clarifier et/ou reclasser les recherches ambiguës (`cartography`, `recovery_logistics`).
- P1: documenter explicitement les effets agrégés-only (defense/anti-air/market).
- P2: renforcer la robustesse/validation structurelle persistence de `researchQueue`.

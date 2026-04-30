# Wiki Content Audit — Coinage (phase 1)

## Commandes exécutées
- `pwd`
- `git rev-parse --show-toplevel`
- `git branch --show-current`
- `git status --short`
- `find docs -maxdepth 5 -type f | sort`
- `find app -maxdepth 6 -type f | sort`
- `find src -maxdepth 7 -type f | sort`
- `rg -n "mine|quarry|refinery|warehouse|resource|production|storage|building|queue|training|troop|unit|research|galaxy|planet|city|combat|attack|defense|colonization|espionage|intel|policy|governance|market|shards|high command|council|space dock|research lab|armament" docs src .`

## Fichiers sources lus (preuve)
- Runtime économie: `src/game/city/economy/cityEconomyConfig.ts`, `src/game/city/economy/cityEconomySystem.ts`, `src/game/city/economy/cityBuildingLevelTables.ts`
- Navigation wiki/UI: `src/lib/wikiNav.ts`, `src/lib/wiki.ts`, `src/app/wiki/[[...slug]]/page.tsx`, `src/components/wiki/WikiComponents.tsx`, `src/styles/globals.css`
- Monde/runtime visuel: `src/components/game/GameShell.tsx`, `src/game/world/galaxyGenerator.ts`, `src/game/render/modes/*`
- Docs design/gameplay: `docs/03-Gameplay-Micro.md`, `docs/04-Gameplay-Macro.md`, `docs/research/research_feature_audit.md`, `docs/units/*.md`, `docs/building/*.md`

## Bâtiments réellement présents
IDs runtime (config typée):
- `hq`, `mine`, `quarry`, `refinery`, `warehouse`, `housing_complex`, `barracks`, `space_dock`, `defensive_wall`, `skyshield_battery`, `armament_factory`, `intelligence_center`, `research_lab`, `market`, `council_chamber`.

## Ressources réellement présentes
- Ressources stockées/produites runtime: `ore`, `stone`, `iron`.
- Capacité de base: `300/300/300`.
- Stock initial: `300/300/180`.
- Système shards: flag `shardsEnabled: false` (non activé runtime).

## Unités réellement présentes
IDs runtime:
- `citizen_militia`, `line_infantry`, `phalanx_lanceguard`, `rail_marksman`, `assault_legionnaire`, `aegis_shieldguard`, `raider_hoverbike`, `siege_breacher`, `assault_dropship`, `swift_carrier`, `interceptor_sentinel`, `ember_drifter`, `rapid_escort`, `bulwark_trireme`, `colonization_arkship`.

## Recherches réellement présentes
40 entrées runtime dans `ResearchId`, incluant notamment:
- Éco/prod: `market_logistics`, `ceramics`, `workforce_loyalty`, `plow`, `workforce_morale`
- Militaire: `railgun_skirmisher`, `city_guard`, `defense_formation`, `offensive_tempo`, `anti_air_defense`
- Naval/colonisation: `shipwright`, `colony_ark`, `naval_mobilization`
- Intel/gouvernance: `espionage`, `cryptography`, `diplomacy`, `democracy`, `command_selection`

## Systèmes runtime implémentés
- Production passive + claim-on-access basé timestamp (`lastUpdatedAtMs`, `applyClaimOnAccess`).
- Stockage par capacité warehouse + clamp.
- Construction avec file (`queueSlots: 2`) et coûts/temps dynamiques.
- Entraînement unités avec prérequis bâtiments/recherche + file dédiée.
- Recherche avec coûts/prérequis/durée + file recherche.
- Politiques locales (`industrial_push`, `martial_law`, `civic_watch`).
- Intel/espionnage: readiness, projets intel, missions, reports snapshot.
- Vue monde: navigation Galaxy/Planet/City côté shell/render.

## Systèmes partiels
- Combat global: stats et bonus existent, mais pas de resolver bataille macro complet prouvé.
- Market: efficacité (`marketEfficiencyPct`) et capacités existent, trade live limité/partiel.
- Colonisation: unité/recherches présentes, boucle complète de fondation inter-planètes partielle.

## Systèmes seulement documentés
- Systèmes token avancés (holder boosts, locking, token servers) majoritairement design/docs.
- Certaines mécaniques alliance/gouvernance étendue: docs plus riches que runtime branché.

## Systèmes absents (code+docs runtime)
- Aucune preuve d’un moteur PvP complet synchronisé serveur avec résolution bataille multi-villes en temps réel.
- Aucune preuve d’un marché global fully transactional branché end-to-end.

## Pages wiki prioritaires à remplir avec preuve source
- Getting started: overview, beginner-guide, core-loop (preuve: game shell + city economy system).
- Economy: resources, production, storage (preuve: config ressources/caps + system claim-on-access).
- Buildings: index + mine/quarry/refinery/warehouse (preuve: building config + level tables).
- Units overview (preuve: `TroopId`, coûts, prérequis).
- Research overview (preuve: `ResearchId`, research queue, effects).
- Combat overview (preuve: stats/bonuses présents, resolver global non prouvé).
- Colonization overview (preuve: `colonization_arkship`, `colony_ark`, limites runtime).

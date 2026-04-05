**COINAGE**

**Stack Technique**

*Architecture, infrastructure et stack technologique*

DOC 06 — TECHNIQUE

Game Design Document — Version 1.0

# Vue d'ensemble

Coinage est construit sur le même stack que GitCities — éprouvé, déployé en production, bien documenté. Les différences principales concernent l'authentification (wallet Solana au lieu de GitHub OAuth) et la source de données (on-chain Solana au lieu de webhooks GitHub).

## Stack principal

| **Composant** | **Technologie** | **Statut vs GitCities** | **Version** |
| --- | --- | --- | --- |
| Frontend | Next.js App Router + TypeScript | Identique | MVP+ |
| Deployment | Vercel | Identique | MVP+ |
| Database | Neon PostgreSQL | Identique | MVP+ |
| ORM | Prisma v5.22.0 — PINNED, jamais upgrader vers v7 | Identique | MVP+ |
| Auth | MVP: session cookie + pseudo • V0: NextAuth email/GitHub • V1+: Privy wallet Solana | Versionné | MVP / V0 / V1+ |
| Queue / Jobs | Upstash QStash — jobs asynchrones | Identique | V0+ |
| World rendering | Three.js — Galaxy View | Différent — Canvas 2D → Three.js | MVP+ |
| City rendering | Three.js — Isométrique | Différent — Canvas 2D → Three.js | MVP+ |
| Planet generation | Three.js + GPGPU Simplex noise (inspiré de procedural-planets) — planètes procédurales générées depuis WORLD_SEED, textures pré-rendues pour la Galaxy View | Nouveau | MVP+ |
| Styling | Tailwind CSS v3 | Identique | MVP+ |
| Token metadata | Jupiter Token API — validation mint address + métadonnées (nom, ticker, logo) dès le MVP | Nouveau | MVP+ |
| RPC Solana | À définir — Helius / QuickNode / Alchemy | Nouveau | V1+ |
| Token datas on-chain | Helius / Birdeye — volume, holders, actifs 30j. Utilisé dès la V1 pour le calcul Signal | Nouveau | V1+ |

## Variables d'environnement

| **Variable** | **Requis** | **Description** | **Version** |
| --- | --- | --- | --- |
| AUTH_SECRET | Oui | Secret auth (min 32 chars) | V0+ |
| PRIVY_APP_ID | Oui | Privy App ID pour wallet auth | V1+ |
| PRIVY_APP_SECRET | Oui | Privy App Secret | V1+ |
| POSTGRES_PRISMA_URL | Oui | Neon pgBouncer URL — Prisma runtime | MVP |
| DIRECT_DATABASE_URL | Oui | Direct Neon URL — migrations uniquement | MVP |
| QSTASH_URL | Oui | Upstash QStash endpoint | V0+ |
| QSTASH_TOKEN | Oui | Upstash QStash token | V0+ |
| QSTASH_CURRENT_SIGNING_KEY | Oui | QStash signature verification | V0+ |
| QSTASH_NEXT_SIGNING_KEY | Oui | QStash signature rotation | V0+ |
| TOKEN_ENCRYPTION_KEY | Oui | AES-256 key — exactement 64 hex chars | V1+ |
| SOLANA_RPC_URL | Oui | Endpoint RPC Solana — à définir au build | V1+ |
| NEXT_PUBLIC_WORLD_SEED | Oui | Seed global pour la génération procédurale de toutes les planètes du monde (toutes neutres au départ) | MVP |
| NEXT_PUBLIC_WORLD_PLANET_COUNT | Oui | Nombre total de planètes générées au lancement du monde. Toutes démarrent neutres — elles deviennent planètes mères au fur et à mesure que les tokens arrivent. | MVP |

MVP minimal : seules les 4 variables MVP sont requises pour faire tourner le MVP.

# Architecture

## Pipeline on-chain — Solana

Remplace le pipeline GitHub webhook de GitCities. Les données on-chain du token sont lues périodiquement et transformées en Signal planétaire.

| **Étape** | **Description** |
| --- | --- |
| 1. Snapshot hebdomadaire | Un job QStash déclenché chaque semaine lit les données on-chain de chaque token actif via le RPC Solana |
| 2. Lecture RPC | Pour chaque token : volume de transactions 7j, nombre de holders actifs 30j, nombre total de holders |
| 3. Calcul Signal | Signal = (données_on_chain × coef) + (joueurs_actifs_7j × coef). Normalisé par capita de joueurs actifs. |
| 4. Mise à jour DB | Le Signal calculé est crédité au trésor planétaire du token concerné dans la DB |
| 5. Immuabilité | Le snapshot est immuable pendant 7 jours — aucune manipulation possible en cours de guerre |

## Auth — Wallet Solana via Privy

Remplace NextAuth GitHub OAuth. Le joueur connecte son wallet Phantom. Privy gère l'auth et fournit l'adresse publique du wallet.

| **Étape** | **Description** |
| --- | --- |
| 1. Connexion wallet | Le joueur connecte Phantom via Privy. Privy retourne l'adresse publique du wallet. |
| 2. Vérification holding | L'API vérifie via RPC Solana que le wallet détient bien les tokens déclarés. |
| 3. Snapshot quotidien | Chaque jour, un job QStash vérifie tous les wallets actifs. Si un wallet n'est plus holder → ville perdue. |
| 4. Session | Session stockée en DB avec wallet address + tokens détenus vérifiés. |

## Patterns critiques — identiques à GitCities

Ces règles s'appliquent sans exception à toutes les mutations de ressources :

• Toujours re-read des valeurs dans une $transaction serializable avant écriture

• Math.min(current + delta, cap) pour les gains — jamais { increment: }

• Math.max(0, current - cost) pour les dépenses — jamais { decrement: }

• Prisma commandes : node_modules/.bin/prisma — jamais npx prisma (lance v7+)

## Commandes utiles

node_modules/.bin/prisma studio          # DB browser

node_modules/.bin/prisma migrate deploy  # Apply migrations (DIRECT_DATABASE_URL)

node_modules/.bin/prisma generate        # Regenerate client

npm run build                            # Production build + ESLint

npx tsc --noEmit                         # Type check only

# Schema DB — Modèles Prisma

Extension du schema GitCities. Les modèles existants (City, Building, ConstructionQueue, ResourceLog) restent identiques. Les nouveaux modèles sont ajoutés.

## Modèles existants — inchangés

| **Modèle** | **Rôle** | **Champs modifiés vs GitCities** |
| --- | --- | --- |
| User -- [MVP] | Identité joueur | githubId → walletAddress. githubToken → supprimé |
| City -- [MVP] | Ville individuelle | ore/stone/iron/shards au lieu de wood/stone/steel/crystal. Ajout : ironVault, planetId (FK vers Planet) |
| Building -- [MVP] | Bâtiment dans une ville | Identique |
| ConstructionQueue -- [MVP] | Queue de construction | Identique |
| ResourceLog -- [MVP] | Logs de gain de ressources | Adapté aux nouvelles ressources |
| DailyCap -- [MVP] | Caps quotidiens anti-abuse | Simplifié — plus de GitHub event counters |

## Nouveaux modèles

### Planet -- [MVP]

id                String   @id

tokenAddress      String?  @unique  -- adresse du token SPL (null si planète encore neutre)

tokenSymbol       String?           -- ex. SOL, BONK, WIF (null si planète encore neutre)

tokenName         String?           -- nom complet du token — récupéré via Jupiter Token API à la création

tokenLogoUrl      String?           -- URL du logo — récupéré via Jupiter Token API à la création

planetType        String            -- NEUTRAL | MOTHER | SECONDARY. Démarre toujours à NEUTRAL. Passe à MOTHER quand le premier joueur d'un token est assigné.

planetStatus      String   @default("PENDING")  -- PENDING | ACTIVE. PENDING = invisible sur la carte, en attente du seuil d'activation. ACTIVE = visible sur la carte monde.

founderUserId     String?           -- FK User — joueur qui a créé la planète. Badge Fondateur permanent.

activationPlayerCount Int @default(0)  -- nombre de joueurs ayant rejoint cette planète. Seuil d'activation : 5.

controlledBy      String?           -- FK Planet (si secondaire)

posX              Float             -- position carte monde (assignée à l'activation, null en PENDING)

posY              Float             -- position carte monde (assignée à l'activation, null en PENDING)

slotCount         Int               -- slots disponibles

signal            Int      @default(0)  -- trésor Signal accumulé -- V1+

treasuryOre       Int      @default(0)  -- trésor planétaire -- V1+

treasuryStone     Int      @default(0)  -- V1+

treasuryIron      Int      @default(0)  -- V1+

holderCount       Int      @default(0)  -- snapshot on-chain (alimenté dès la V1) -- V1+

activeWallets30d  Int      @default(0)  -- snapshot on-chain (alimenté dès la V1) -- V1+

weeklyVolume      Float    @default(0)  -- snapshot on-chain (alimenté dès la V1) -- V1+

lastSnapshotAt    DateTime?  -- V1+

reputation        Int      @default(0)  -- score réputation diplomatique -- V2+

### PlanetBranch -- [V1+]

id         String   @id

planetId   String   -- FK Planet

branch     String   -- ECONOMIC | MILITARY | DIPLOMATIC

level      Int      @default(0)  -- palier actuel (0-20)

isActive   Boolean  @default(false)  -- branche en cours de progression

### Alliance -- [V2+]

id          String   @id

name        String

createdAt   DateTime

dissolvedAt DateTime?

isSecret    Boolean  @default(false)  -- diplomatie secrète palier 8

secretUntil DateTime?

### AllianceMember -- [V2+]

id         String   @id

allianceId String   -- FK Alliance

planetId   String   -- FK Planet

joinedAt   DateTime

leftAt     DateTime?

### War -- [V2+]

id              String    @id

attackerPlanetId String   -- FK Planet

defenderPlanetId String   -- FK Planet

status          String    -- DECLARED | ACTIVE | ENDED

declaredAt      DateTime

startedAt       DateTime?

endedAt         DateTime?

endReason       String?   -- PEACE | SURRENDER | CONQUEST | ABANDON

### CouncilMember -- [V2+]

id         String   @id

planetId   String   -- FK Planet

userId     String   -- FK User

role       String   -- GOVERNOR | GENERAL | DIPLOMAT | MEMBER

joinedAt   DateTime

lastActiveAt DateTime

### SpyMission -- [V0+]

id              String   @id

fromCityId      String   -- FK City

targetCityId    String?  -- FK City (null si analyse planétaire)

targetPlanetId  String?  -- FK Planet (analyse planétaire)

missionType     String   -- RECON | INFILTRATION | SURVEILLANCE | SABOTAGE | GHOST | PLANETARY

ironSpent       Int

status          String   -- IN_TRANSIT | SUCCESS | FAILED | DETECTED

arrivalAt       DateTime

createdAt       DateTime

### TroopMovement -- [V0+]

id           String   @id

fromCityId   String   -- FK City

toCityId     String   -- FK City (destination)

movementType String   -- ATTACK | SUPPORT | COLLECTIVE | COLONIZE

units        Json     -- { infantry: 50, marksman: 20, ... }

status       String   -- IN_TRANSIT | ARRIVED | RETURNING | CANCELLED

departedAt   DateTime

arrivalAt    DateTime

### CollectiveArmy -- [V2+]

id         String   @id

planetId   String   @unique  -- FK Planet

units      Json     -- { infantry: 500, assault: 200, interceptor: 100, ... }

updatedAt  DateTime

### TradeRoute -- [V3+]

id           String   @id

fromCityId   String   -- FK City

toCityId     String   -- FK City

routeType    String   -- INTERNAL | MARKET | EXCHANGE

ore          Int      @default(0)

stone        Int      @default(0)

iron         Int      @default(0)

status       String   -- IN_TRANSIT | DELIVERED | CANCELLED

departedAt   DateTime

arrivalAt    DateTime

# API Surface — Routes principales

À documenter en détail au moment du build. Vue d'ensemble des routes attendues.

## Auth & Session

| **Route** | **Méthode** | **Description** |
| --- | --- | --- |
| /api/auth/wallet | POST | Connexion wallet Solana via Privy |
| /api/auth/verify-holding | POST | Vérification on-chain du holding du token |
| /api/auth/session | GET | Session courante |

## Villes

| **Route** | **Méthode** | **Description** |
| --- | --- | --- |
| /api/cities | GET / POST | Liste des villes du joueur / Créer une ville (si slot disponible) |
| /api/cities/[cityId] | GET / PATCH | État de la ville / Toggle activité |
| /api/cities/[cityId]/resources | GET | Polling ressources léger |
| /api/cities/[cityId]/build | POST | Lancer construction / upgrade |
| /api/cities/[cityId]/complete | POST | Finaliser construction terminée |

## Planètes

| **Route** | **Méthode** | **Description** |
| --- | --- | --- |
| /api/planets | GET | Liste des planètes (carte monde) |
| /api/planets/[planetId] | GET | Détail d'une planète |
| /api/planets/[planetId]/treasury | GET / POST | Trésor planétaire / Contribuer |
| /api/planets/[planetId]/army | GET / POST | Armée collective / Contribuer des troupes |
| /api/planets/[planetId]/branches | GET / POST | Branches technologiques / Progresser |
| /api/planets/[planetId]/council | GET | Membres du Conseil |

## Militaire

| **Route** | **Méthode** | **Description** |
| --- | --- | --- |
| /api/troops/train | POST | Former des unités dans une ville |
| /api/troops/move | POST | Déplacer des troupes (raid, siège, soutien, colonisation) |
| /api/troops/movements | GET | Mouvements en cours |
| /api/wars | GET / POST | Guerres actives / Déclarer une guerre |
| /api/wars/[warId] | GET | Détail d'une guerre |

## Espionnage

| **Route** | **Méthode** | **Description** |
| --- | --- | --- |
| /api/spy/vault | GET / POST | Vault d'Iron / Déposer de l'Iron |
| /api/spy/mission | POST | Lancer une mission d'espionnage |
| /api/spy/missions | GET | Missions en cours et historique |

## Jobs QStash

| **Route** | **Description** |
| --- | --- |
| /api/jobs/process-onchain-snapshot | Snapshot hebdomadaire des données on-chain Solana → calcul Signal |
| /api/jobs/process-holding-check | Snapshot quotidien des holdings → perte de ville si plus holder |
| /api/jobs/process-troop-arrival | Résolution des mouvements de troupes arrivés |
| /api/jobs/process-trade-arrival | Résolution des routes de trading arrivées |
| /api/jobs/process-spy-arrival | Résolution des missions d'espionnage arrivées |

# Points à définir au build

| **Point** | **Description** |
| --- | --- |
| Provider RPC Solana | Helius / QuickNode / Alchemy — à choisir selon pricing et fiabilité |
| Fréquence snapshot on-chain | Hebdomadaire défini. Méthode exacte de lecture (getProgramAccounts, getTokenLargestAccounts, etc.) à définir |
| Calcul exact du Signal | Coefficients on-chain vs joueurs actifs à calibrer au balancing |
| Système de combat — résolution | Calcul exact des formules de combat, gestion des pertes, résolution des batailles |
| Timers de construction | Valeurs exactes par bâtiment et par niveau |
| Coûts de production | Ore/Stone/Iron par unité militaire, par niveau de bâtiment |
| Snapshot quotidien holding | Méthode exacte pour vérifier le holding de millions de wallets efficacement |
| 3 vues du jeu | Galaxy View, Planet View, City View — design et implémentation |
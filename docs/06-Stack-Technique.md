**COINAGE**

**Stack Technique**

*Architecture applicative, données et exploitation*

Version 2.0 — Avril 2026

# Stack principal

| Composant | Technologie |
| --- | --- |
| Frontend | Next.js App Router + TypeScript |
| UI | Tailwind CSS |
| DB | Neon PostgreSQL |
| ORM | Prisma v5.22.0 (version verrouillée) |
| Jobs | Upstash QStash |
| Déploiement | Vercel |
| Visualisation monde | Three.js (world map 2D sectorisée) |

# Variables d’environnement clés

| Variable | Usage |
| --- | --- |
| POSTGRES_PRISMA_URL | Connexion runtime Prisma |
| DIRECT_DATABASE_URL | Migrations |
| NEXT_PUBLIC_WORLD_SEED | Seed de génération de la carte |
| NEXT_PUBLIC_WORLD_SECTOR_COUNT | Nombre de secteurs au lancement |
| SOLANA_RPC_URL | Lecture données on-chain |
| AUTH_SECRET | Sécurité session |

# Modèle de données (conceptuel)

## Entités

- `User` : identité joueur
- `City` : base individuelle
- `Faction` : identité token + gouvernance
- `Sector` : unité territoriale de carte
- `FactionBranch` : progression macro
- `Alliance` : relation multi-factions
- `War` : conflit déclaré
- `TroopMovement` : déplacements d’unités
- `SpyMission` : missions de renseignement

## Règles métier de carte

- Tous les `Sector` démarrent en statut `NEUTRAL`
- Un `Sector` passe en `CORE` à la première activation de faction
- Un `Sector` passe en `CONTROLLED` après capture/colonisation validée

# Pipeline on-chain

1. Snapshot périodique des tokens actifs
2. Agrégation d’indicateurs (activité, volume, détenteurs)
3. Calcul du Signal de faction
4. Crédit en base dans le trésor de faction
5. Gel du snapshot sur la fenêtre active de conflit

# Patterns transactionnels (obligatoires)

- Relecture systématique des valeurs en transaction serializable
- Gains avec borne haute (`min`)
- Dépenses avec borne basse (`max`)
- Pas de mutation aveugle sur ressources critiques

# Commandes utiles

- `node_modules/.bin/prisma generate`
- `node_modules/.bin/prisma migrate deploy`
- `node_modules/.bin/prisma studio`
- `npm run build`
- `npx tsc --noEmit`

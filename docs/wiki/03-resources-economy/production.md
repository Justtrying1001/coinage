# Production

## Comment ça fonctionne
La production est **passive et timestampée**: les gains sont appliqués au fil du temps puis crédités lors de l’accès/refresh d’état (pattern claim-on-access).

## Bâtiments producteurs
- **Mine**: production ore.
- **Quarry**: production stone.
- **Refinery**: production iron.

## Modificateurs runtime
- Recherches `productionPct`.
- Policies locales orientées production.
- Pénalités temporaires (ex. certains états de milice selon système local).

## Point d’attention
Le rendement réel dépend aussi de la capacité: si tu capes, la production excédentaire est perdue.

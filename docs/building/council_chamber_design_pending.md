# Council Chamber — Design Pending

## Vérité produit confirmée
`council_chamber` est un bâtiment de **diplomatie / participation macro de faction**.

Confirmé:
- pas de bonus local de build,
- pas de bonus local de défense,
- pas de stat passive locale.

## Ce qui n’est PAS décidé
- mécanique diplomatie macro finale (votes, mandats, participation token/faction, etc.),
- valeur gameplay exacte des niveaux dans cette boucle macro,
- mapping final entre `council_chamber` et une éventuelle UI/système de gouvernance macro dédié.

## Ce qui existe actuellement dans le runtime
- bâtiment construisible avec progression 1..25 (coûts/temps/population),
- prérequis runtime: `HQ 15`, `market 10`, `research_lab 15`,
- aucun effet local derivé depuis ses niveaux,
- système `policy` local toujours présent mais transitionnel (non gate council: `requiredCouncilLevel=0`).

## Pourquoi l’ancien modèle à bonus locaux était faux
Le modèle précédent injectait `buildSpeedPct` et `cityDefensePct` depuis `council_chamber`, créant un rôle local economy/combat passif incompatible avec la direction produit diplomatie-only.

## Questions de design ouvertes
1. Les niveaux 1..25 doivent-ils rester tels quels ou être redimensionnés pour la boucle macro ?
2. Quel gate runtime réel doit être attaché au council (accès écran diplomatie, actions de faction, votes, etc.) ?
3. Le système `policy` transitionnel doit-il être supprimé, déplacé vers un autre bâtiment, ou re-spécifié comme diplomatie locale ?
4. Quelle relation explicite entre council et token/faction participation MVP est retenue ?

## Prochaines décisions produit à prendre
- Spécifier le consumer macro minimal MVP du council.
- Décider si les niveaux doivent ouvrir des paliers diplomatiques explicites.
- Décider du sort du système policy local transitionnel (conserver/reclasser/remplacer).

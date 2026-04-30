# WIKI UI Audit — April 30, 2026

## Cause exacte du rendu actuel

1. Le routing wiki est centralisé dans `src/app/wiki/[[...slug]]/page.tsx` avec un catch-all unique, ce qui mélange landing + pages internes dans un seul composant sans architecture produit dédiée.
2. Le rendu de contenu markdown utilisait `<pre>{page.content}</pre>`, affichant le markdown brut au lieu d'un rendu éditorial.
3. L’ancienne logique de navigation auto-construisait les pages à partir de dossiers `01-...`, `02-...` via `extra` dans `src/lib/wikiNav.ts`, injectant mécaniquement les préfixes numériques et `README.md` dans les chemins internes.
4. Les liens de navigation montraient les slugs techniques (`getting-started/overview`) au lieu de labels éditoriaux.
5. La gestion de langue passait par `/wiki/fr/...` et `/wiki/en/...` mais la landing listait globalement des catégories/pages sans séparation éditoriale stricte, donnant une impression de mélange FR/EN.

## Fichiers responsables (état initial)

- `src/app/wiki/[[...slug]]/page.tsx`
- `src/lib/wiki.ts`
- `src/lib/wikiNav.ts`
- `src/styles/globals.css` (styles wiki minimaux, non premium)

## Problèmes UX/UI listés

- Landing wiki perçue comme liste technique, pas comme feature produit.
- Niveaux hiérarchiques faibles (pas de vrai hero, pas de système de sections éditoriales profondes).
- Markdown brut visible (pas de typographie wiki, pas de composants documentaires).
- Sidebar/navigation proche d’un dump de fichiers.
- Statuts peu lisibles visuellement.

## Problèmes contenu/navigation

- URLs techniques et non éditoriales dans les libellés.
- Usage de `README.md` comme page “index” non encapsulé côté UX.
- Préfixes `01-`, `02-` etc. présents dans les chemins internes et influençant la structure publique.
- Bascules de langue trop mécaniques ; fallback non éditorialisé.

## Plan de correction

1. Introduire un registre éditorial manuel (`src/lib/wikiNav.ts`) avec catégories/pages publiques, ordre et métadonnées.
2. Dissocier strictement chemins publics et chemins markdown internes.
3. Garder `/wiki` comme landing premium et fournir des routes publiques propres (`/wiki/buildings/mine`, etc.).
4. Implémenter un fallback de langue propre avec badge “Translation pending”.
5. Refondre l’UI avec composants dédiés (layout, cards, badges, breadcrumb, toc, related, prev/next).
6. Remplacer le rendu brut markdown par rendu structuré.
7. Forcer une navigation éditoriale (pas d’exploration de fichiers, pas d’exposition `.md`).

export type WikiStatus = 'Implemented' | 'Partially implemented' | 'Documented only' | 'Planned' | 'Design in progress';
export type WikiLang = 'en' | 'fr';

export type WikiPage = {
  slug: string;
  categorySlug: string;
  title: string;
  description: string;
  publicPath: string;
  internalPath: string;
  status: WikiStatus;
  tags: string[];
  related: string[];
};

export type WikiCategory = {
  slug: string;
  title: string;
  description: string;
  featured: string;
};

const page = (p: Omit<WikiPage, 'publicPath'>): WikiPage => ({ ...p, publicPath: `/wiki/${p.categorySlug}${p.slug ? `/${p.slug}` : ''}` });

export const wikiCategories: WikiCategory[] = [
  { slug: 'getting-started', title: 'Getting Started', description: 'Onboarding and first progression loops.', featured: 'overview' },
  { slug: 'resources-economy', title: 'Resources & Economy', description: 'Resources, production, storage and market.', featured: 'resources' },
  { slug: 'buildings', title: 'Buildings', description: 'City structures and economy/military impact.', featured: '' },
  { slug: 'units', title: 'Units', description: 'Infantry, ships, defense and specialist units.', featured: '' },
  { slug: 'research', title: 'Research', description: 'Progression branches and unlock strategy.', featured: '' },
  { slug: 'combat', title: 'Combat', description: 'Attack, defense, timing and battle rules.', featured: 'overview' },
  { slug: 'world', title: 'World', description: 'Galaxy/planet/city navigation and expansion context.', featured: 'galaxy' },
  { slug: 'colonization', title: 'Colonization', description: 'Colony expansion requirements and limits.', featured: 'overview' },
  { slug: 'alliances-governance', title: 'Alliances & Governance', description: 'Social structures and governance systems.', featured: 'governance' },
  { slug: 'token-systems', title: 'Token Systems', description: 'Shards, holder boosts and token server rules.', featured: 'overview' },
];

export const wikiPages: WikiPage[] = [
  page({ categorySlug: 'getting-started', slug: 'overview', title: 'Overview', description: 'What Coinage is and how to start.', internalPath: '01-getting-started/overview.md', status: 'Implemented', tags: ['onboarding'], related: ['/wiki/getting-started/beginner-guide', '/wiki/getting-started/core-loop'] }),
  page({ categorySlug: 'getting-started', slug: 'beginner-guide', title: 'Beginner Guide', description: 'First hour progression guide.', internalPath: '01-getting-started/beginner-guide.md', status: 'Partially implemented', tags: ['guide'], related: ['/wiki/resources-economy/resources'] }),
  page({ categorySlug: 'getting-started', slug: 'core-loop', title: 'Core Loop', description: 'Build, produce, upgrade, expand.', internalPath: '01-getting-started/core-loop.md', status: 'Implemented', tags: ['loop'], related: ['/wiki/buildings', '/wiki/research'] }),
  page({ categorySlug: 'resources-economy', slug: 'resources', title: 'Resources', description: 'Resource pillars and flow.', internalPath: '03-resources-economy/resources.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/resources-economy/production', '/wiki/resources-economy/storage'] }),
  page({ categorySlug: 'resources-economy', slug: 'production', title: 'Production', description: 'Generation and production scaling.', internalPath: '03-resources-economy/production.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/buildings/mine'] }),
  page({ categorySlug: 'resources-economy', slug: 'storage', title: 'Storage', description: 'Warehousing and capacity rules.', internalPath: '03-resources-economy/storage.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/buildings/warehouse'] }),
  page({ categorySlug: 'resources-economy', slug: 'market', title: 'Market', description: 'Trades, exchanges and taxes.', internalPath: '03-resources-economy/market.md', status: 'Partially implemented', tags: ['market'], related: ['/wiki/buildings/market'] }),
  page({ categorySlug: 'resources-economy', slug: 'shards', title: 'Shards', description: 'Special resource and strategic use.', internalPath: '03-resources-economy/shards.md', status: 'Documented only', tags: ['token'], related: ['/wiki/token-systems/overview'] }),
  page({ categorySlug: 'buildings', slug: '', title: 'Buildings Overview', description: 'Building categories and progression.', internalPath: '04-buildings/README.md', status: 'Implemented', tags: ['city'], related: ['/wiki/buildings/mine'] }),
  page({ categorySlug: 'buildings', slug: 'mine', title: 'Mine', description: 'Primary ore extraction building.', internalPath: '04-buildings/mine.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/resources-economy/production'] }),
  page({ categorySlug: 'units', slug: '', title: 'Units Overview', description: 'Unit families and gameplay roles.', internalPath: '05-units/README.md', status: 'Partially implemented', tags: ['military'], related: ['/wiki/combat/overview'] }),
  page({ categorySlug: 'research', slug: '', title: 'Research Overview', description: 'Research branches and unlock logic.', internalPath: '06-research/README.md', status: 'Implemented', tags: ['tech'], related: ['/wiki/research/economy-research'] }),
  page({ categorySlug: 'combat', slug: 'overview', title: 'Combat Overview', description: 'Combat principles and engagements.', internalPath: '07-combat/overview.md', status: 'Implemented', tags: ['military'], related: ['/wiki/combat/attack', '/wiki/combat/defense'] }),
  page({ categorySlug: 'world', slug: 'galaxy', title: 'Galaxy', description: 'Galaxy map and macro navigation.', internalPath: '02-world/galaxy.md', status: 'Implemented', tags: ['navigation'], related: ['/wiki/world/planets'] }),
  page({ categorySlug: 'world', slug: 'planets', title: 'Planets', description: 'Planet types and strategic slots.', internalPath: '02-world/planets.md', status: 'Implemented', tags: ['navigation'], related: ['/wiki/world/cities'] }),
  page({ categorySlug: 'world', slug: 'cities', title: 'Cities', description: 'City layer and infrastructure.', internalPath: '02-world/cities.md', status: 'Implemented', tags: ['navigation'], related: ['/wiki/buildings'] }),
  page({ categorySlug: 'colonization', slug: 'overview', title: 'Colonization Overview', description: 'Colony expansion strategy.', internalPath: '08-colonization/overview.md', status: 'Partially implemented', tags: ['expansion'], related: ['/wiki/colonization/requirements'] }),
  page({ categorySlug: 'alliances-governance', slug: 'governance', title: 'Governance', description: 'Leadership and control layers.', internalPath: '09-alliances-governance/governance.md', status: 'Design in progress', tags: ['social'], related: ['/wiki/alliances-governance/roles'] }),
  page({ categorySlug: 'token-systems', slug: 'overview', title: 'Token Systems Overview', description: 'Token-connected systems and runtime.', internalPath: '10-token-systems/overview.md', status: 'Design in progress', tags: ['token'], related: ['/wiki/resources-economy/shards'] }),
];

export const pageByPath = new Map(wikiPages.map((p) => [[p.categorySlug, p.slug].filter(Boolean).join('/'), p]));

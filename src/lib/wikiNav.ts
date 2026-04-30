export type WikiStatus = 'Implemented' | 'Partially implemented' | 'Documented only' | 'Planned' | 'Design in progress';
export type WikiLang = 'en' | 'fr';

export type WikiPage = {
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  description: string;
  status: WikiStatus;
  filePath: string;
  tags: string[];
  related: string[];
  order: number;
  publicPath: string;
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
  { slug: 'world', title: 'World & Cities', description: 'Galaxy/planet/city navigation and expansion context.', featured: 'galaxy' },
  { slug: 'colonization', title: 'Colonization', description: 'Colony expansion requirements and limits.', featured: 'overview' },
  { slug: 'alliances-governance', title: 'Governance', description: 'Social structures and governance systems.', featured: 'governance' },
  { slug: 'token-systems', title: 'Token Systems', description: 'Shards, holder boosts and token server rules.', featured: 'overview' },
];

export const wikiPages: WikiPage[] = [
  page({ category: 'Getting Started', categorySlug: 'getting-started', slug: 'overview', title: 'Overview', description: 'What Coinage is and how to start.', filePath: '01-getting-started/overview.md', status: 'Implemented', tags: ['onboarding'], related: ['/wiki/getting-started/beginner-guide', '/wiki/getting-started/core-loop'], order: 1 }),
  page({ category: 'Getting Started', categorySlug: 'getting-started', slug: 'beginner-guide', title: 'Beginner Guide', description: 'Learn your first city loop, resource flow, and early priorities.', filePath: '01-getting-started/beginner-guide.md', status: 'Partially implemented', tags: ['guide'], related: ['/wiki/getting-started/core-loop', '/wiki/resources-economy/resources'], order: 2 }),
  page({ category: 'Getting Started', categorySlug: 'getting-started', slug: 'core-loop', title: 'Core Loop', description: 'Understand how production, construction, training, and expansion connect.', filePath: '01-getting-started/core-loop.md', status: 'Implemented', tags: ['loop'], related: ['/wiki/buildings', '/wiki/research'], order: 3 }),
  page({ category: 'Resources & Economy', categorySlug: 'resources-economy', slug: 'resources', title: 'Resources', description: 'Track the economy behind cities, queues, and progression.', filePath: '03-resources-economy/resources.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/resources-economy/production', '/wiki/resources-economy/storage'], order: 1 }),
  page({ category: 'Resources & Economy', categorySlug: 'resources-economy', slug: 'production', title: 'Production', description: 'Generation rates, extraction, and throughput scaling.', filePath: '03-resources-economy/production.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/buildings/mine'], order: 2 }),
  page({ category: 'Resources & Economy', categorySlug: 'resources-economy', slug: 'storage', title: 'Storage', description: 'Capacity rules and warehouse scaling.', filePath: '03-resources-economy/storage.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/buildings/warehouse'], order: 3 }),
  page({ category: 'Buildings', categorySlug: 'buildings', slug: '', title: 'Buildings Overview', description: 'Explore what each structure unlocks or improves.', filePath: '04-buildings/README.md', status: 'Implemented', tags: ['city'], related: ['/wiki/buildings/mine', '/wiki/buildings/quarry', '/wiki/buildings/refinery'], order: 1 }),
  page({ category: 'Buildings', categorySlug: 'buildings', slug: 'mine', title: 'Mine', description: 'Primary ore extraction building and upgrade milestones.', filePath: '04-buildings/mine.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/resources-economy/production'], order: 2 }),
  page({ category: 'Buildings', categorySlug: 'buildings', slug: 'quarry', title: 'Quarry', description: 'Stone extraction backbone for construction pacing.', filePath: '04-buildings/quarry.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/resources-economy/production'], order: 3 }),
  page({ category: 'Buildings', categorySlug: 'buildings', slug: 'refinery', title: 'Refinery', description: 'Converts raw materials into advanced inputs.', filePath: '04-buildings/refinery.md', status: 'Partially implemented', tags: ['economy'], related: ['/wiki/resources-economy/resources'], order: 4 }),
  page({ category: 'Buildings', categorySlug: 'buildings', slug: 'warehouse', title: 'Warehouse', description: 'Increases storage ceilings across resource families.', filePath: '04-buildings/warehouse.md', status: 'Implemented', tags: ['economy'], related: ['/wiki/resources-economy/storage'], order: 5 }),
  page({ category: 'Units', categorySlug: 'units', slug: '', title: 'Units Overview', description: 'Unit families and battlefield roles.', filePath: '05-units/README.md', status: 'Partially implemented', tags: ['military'], related: ['/wiki/combat/overview'], order: 1 }),
  page({ category: 'Research', categorySlug: 'research', slug: '', title: 'Research Overview', description: 'Research branches and unlock strategy.', filePath: '06-research/README.md', status: 'Implemented', tags: ['tech'], related: ['/wiki/research/economy-research'], order: 1 }),
  page({ category: 'Combat', categorySlug: 'combat', slug: 'overview', title: 'Combat Overview', description: 'Engagement flow, movement timing, and outcomes.', filePath: '07-combat/overview.md', status: 'Implemented', tags: ['military'], related: ['/wiki/combat/attack', '/wiki/combat/defense'], order: 1 }),
  page({ category: 'Colonization', categorySlug: 'colonization', slug: 'overview', title: 'Colonization Overview', description: 'Expansion requirements and strategic trade-offs.', filePath: '08-colonization/overview.md', status: 'Partially implemented', tags: ['expansion'], related: ['/wiki/colonization/requirements'], order: 1 }),
];

export const pageByPath = new Map(wikiPages.map((p) => [[p.categorySlug, p.slug].filter(Boolean).join('/'), p]));

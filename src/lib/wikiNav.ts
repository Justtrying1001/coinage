export type WikiStatus = 'Implemented' | 'Partially implemented' | 'Documented only' | 'Planned' | 'Design in progress';

export type WikiNavPage = {
  slug: string;
  title: string;
  description: string;
  status: WikiStatus;
  sourcePathFr: string;
  sourcePathEn: string;
  tags: string[];
  related: string[];
};

export type WikiCategory = {
  slug: string;
  title: string;
  description: string;
  pages: WikiNavPage[];
};

export const wikiCategories: WikiCategory[] = [
  {
    slug: 'getting-started', title: 'Getting started', description: 'Onboarding and core loop.', pages: [
      { slug: 'overview', title: 'Overview', description: 'What Coinage is and how to approach it.', status: 'Partially implemented', sourcePathFr: '01-getting-started/overview.md', sourcePathEn: '01-getting-started/overview.md', tags: ['onboarding'], related: ['getting-started/beginner-guide', 'getting-started/core-loop'] },
      { slug: 'beginner-guide', title: 'Beginner guide', description: 'First steps for new players.', status: 'Partially implemented', sourcePathFr: '01-getting-started/beginner-guide.md', sourcePathEn: '01-getting-started/beginner-guide.md', tags: ['guide'], related: ['resources-economy/resources'] },
      { slug: 'core-loop', title: 'Core loop', description: 'Build, produce, research, expand.', status: 'Partially implemented', sourcePathFr: '01-getting-started/core-loop.md', sourcePathEn: '01-getting-started/core-loop.md', tags: ['loop'], related: ['buildings', 'research'] },
      { slug: 'glossary', title: 'Glossary', description: 'Key terms used by the game.', status: 'Documented only', sourcePathFr: '01-getting-started/glossary.md', sourcePathEn: '01-getting-started/glossary.md', tags: ['reference'], related: ['reference/faq'] },
    ]
  },
  { slug:'world', title:'World', description:'Galaxy, planets and seasonal servers.', pages:[
    {slug:'galaxy', title:'Galaxy', description:'World map and travel space.', status:'Partially implemented', sourcePathFr:'02-world/galaxy.md', sourcePathEn:'02-world/galaxy.md', tags:['world'], related:['world/planets','combat/travel-time']},
    {slug:'planets', title:'Planets', description:'Planet types and city slots.', status:'Partially implemented', sourcePathFr:'02-world/planets.md', sourcePathEn:'02-world/planets.md', tags:['world'], related:['world/cities']},
    {slug:'cities', title:'Cities', description:'City foundations and progression.', status:'Implemented', sourcePathFr:'02-world/cities.md', sourcePathEn:'02-world/cities.md', tags:['city'], related:['buildings','resources-economy/production']},
    {slug:'seasons-and-servers', title:'Seasons and servers', description:'Season cadence and server variants.', status:'Design in progress', sourcePathFr:'02-world/seasons-and-servers.md', sourcePathEn:'02-world/seasons-and-servers.md', tags:['season'], related:['token-systems/token-servers']},
    {slug:'token-factions', title:'Token factions', description:'Factional layer tied to token systems.', status:'Design in progress', sourcePathFr:'02-world/token-factions.md', sourcePathEn:'02-world/token-factions.md', tags:['token'], related:['token-systems/overview']},
  ]},
];

const extra = [
['resources-economy','Resources & Economy','Production, storage, market and shards',['resources','production','storage','shards','market'],'03-resources-economy'],
['buildings','Buildings','City buildings and their gameplay impact',['index','mine','quarry','refinery','warehouse','barracks','space-dock','research-lab','armament-factory','council-chamber','high-command','intelligence-center'],'04-buildings'],
['units','Units','Military and special units',['index','infantry','ships','defensive-units','colonization-units','spy-units'],'05-units'],
['research','Research','Tech branches and progression gates',['index','economy-research','military-research','colonization-research','espionage-research','governance-research'],'06-research'],
['combat','Combat','Attack and defense resolution',['overview','attack','defense','travel-time','battle-resolution','scouting-and-espionage'],'07-combat'],
['colonization','Colonization','Expansion to new colonies',['overview','requirements','colonization-flow','limits'],'08-colonization'],
['alliances-governance','Alliances & Governance','Social and macro systems',['alliances','wars','alliance-bank','governance','roles'],'09-alliances-governance'],
['token-systems','Token systems','Token-based systems and server variants',['overview','token-servers','token-performance','holder-boosts','future-token-locking'],'10-token-systems'],
['guides','Guides','Practical player guides',['first-hour-guide','city-growth-guide','economy-guide','military-guide','alliance-guide'],'11-guides'],
['reference','Reference','FAQ, formulas and tables',['faq','formulas','tables','status-effects'],'12-reference']
] as const;

for (const [slug,title,description,pages,folder] of extra){
  wikiCategories.push({slug,title,description,pages:(pages as readonly string[]).map((p)=>({
    slug:p==='index'?'':p,
    title:p==='index'?'Overview':p.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
    description:`${title} — ${p==='index'?'overview':p}.`,
    status:'Partially implemented',
    sourcePathFr:`${folder}/${p==='index'?'README':p}.md`,
    sourcePathEn:`${folder}/${p==='index'?'README':p}.md`,
    tags:[slug],
    related:[]
  }))});
}

export const allWikiPages = wikiCategories.flatMap((category)=>category.pages.map((page)=>({category,...page,fullSlug:[category.slug,page.slug].filter(Boolean).join('/')})));

export function findWikiPageBySlug(parts: string[]) { const full=parts.join('/'); return allWikiPages.find((p)=>p.fullSlug===full) ?? null; }

// All visible film copy. The ALL CAPS lines are the owner's, verbatim. Do not restyle or reword them.
import type { SourceId } from './sources';

export const site = {
  name: 'AIR POLLUTION',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  description:
    'A seven chapter scroll film about air pollution: from orbit, through a city, into a lung, and back out to the choices still open to us.',
};

export type Fact = { text: string; source: SourceId };

// `len` is scroll length in screens. `built` marks chapters whose 3D scene exists; the others
// show their DOM art over the canvas until Milestone 2.
export const chapters = [
  { n: 1, id: 'ch-1', scene: 'earth-opening', name: 'A world that could breathe', len: 4, built: true },
  { n: 2, id: 'ch-2', scene: 'atmosphere', name: 'The invisible enemy', len: 5, built: true },
  { n: 3, id: 'ch-3', scene: 'polluted-city', name: 'The cost of progress', len: 6, built: false },
  { n: 4, id: 'ch-4', scene: 'human-lungs', name: 'Every breath matters', len: 9, built: false },
  { n: 5, id: 'ch-5', scene: 'child-city', name: 'The future we face', len: 3, built: false },
  { n: 6, id: 'ch-6', scene: 'future-city', name: 'The world can still change', len: 4, built: false },
  { n: 7, id: 'ch-7', scene: 'earth-ending', name: 'The next breath is ours', len: 6, built: true },
] as const;

export type Chapter = (typeof chapters)[number];

export const copy = {
  one: {
    title: ['A WORLD', 'THAT COULD', 'BREATHE.'],
    voice: 'Once, the air around us was a symbol of life.',
  },
  two: {
    title: ['THE AIR', 'BEGAN', 'TO CHANGE.'],
    voice: 'Nobody saw it arrive. One fine particle is too small to see.',
    facts: [
      { text: 'A human hair is about 70 micrometres across, 30 times wider than the largest fine particle.', source: 'epa-pm' },
      { text: 'In 2019, 99% of the world’s people lived in places that did not meet WHO air quality guidelines.', source: 'who-ambient' },
    ] satisfies Fact[],
  },
  three: {
    title: ['OUR PROGRESS', 'LEFT A TRACE.'],
    sources: [
      { name: 'Smokestacks and fires', text: 'Release particles straight into the air.', source: 'epa-pm' },
      { name: 'Power plants, factories, cars and trucks', text: 'Emit gases that react in the air and form more particles.', source: 'epa-pm' },
      { name: 'Construction sites and unpaved roads', text: 'Lift dust into the air people walk through.', source: 'epa-pm' },
      { name: 'Fuel burned in transport and industry', text: 'The main source of nitrogen dioxide. Burning coal and oil adds sulfur dioxide.', source: 'who-ambient' },
    ] as { name: string; text: string; source: SourceId }[],
  },
  four: {
    titleA: ['THE AIR', 'WE POLLUTE...'],
    titleB: ['...IS THE AIR', 'WE BREATHE.'],
    path: ['Nose', 'Trachea', 'Bronchi', 'Alveoli'],
    note: 'Illustration, not to scale.',
    facts: [
      { text: 'Particles under 10 micrometres can reach deep into the lungs, and some may enter the bloodstream. Fine particles carry the greatest risk.', source: 'epa-pm' },
      { text: 'Of the 4.2 million premature deaths linked to outdoor air in 2019, 68% were from heart disease and stroke, 14% from COPD, 14% from lower respiratory infections and 4% from lung cancer.', source: 'who-ambient' },
    ] satisfies Fact[],
  },
  five: {
    title: ['WHAT KIND', 'OF WORLD ARE WE', 'LEAVING BEHIND?'],
    fact: { text: 'More than 700,000 deaths of children under five were linked to air pollution in 2021.', source: 'soga-2024' } satisfies Fact,
  },
  six: {
    title: ['THE FUTURE', 'IS NOT WRITTEN', 'IN SMOKE.'],
    solutions: ['Cleaner transport', 'Clean power from sun and wind', 'Energy efficient homes', 'Better waste management'],
    solutionsSource: 'who-ambient' as SourceId,
    facts: [
      { text: 'Beijing reports PM2.5 down 64.2% in 2023 compared with 2013.', source: 'beijing' },
      { text: 'London’s roadside nitrogen dioxide was 27% lower in 2024 than modelled without its Ultra Low Emission Zone.', source: 'london' },
      { text: 'WHO estimates that reaching its first interim target for PM2.5 would save around 300,000 lives a year.', source: 'who-ambient' },
    ] satisfies Fact[],
  },
  seven: {
    title: ['AIR POLLUTION', 'IS A GLOBAL', 'CHALLENGE.'],
    protect: ['PROTECT THE AIR.', 'PROTECT LIFE.'],
    cta: 'THE NEXT BREATH IS OURS.',
    ctaHref: '/sources#act',
  },
};

export const act = {
  intro: 'WHO says most sources of outdoor air pollution are beyond the control of any one person. So this list has two halves: what you can change yourself, and who you can ask to change the rest.',
  yourself: [
    'Walk, cycle or take public transport when you can.',
    'Never burn rubbish. Reduce and sort what you throw away.',
    { before: 'Check your ', link: 'local air quality reading', href: 'https://aqicn.org/here/', after: ' before spending long periods outdoors.' },
    'Use less energy at home, and ask whether it can come from cleaner sources.',
  ],
  together: [
    'Ask your school how it manages air quality around drop-off and pick-up.',
    'Ask your local council what it is doing about transport, waste and industry.',
    'Share what you learned here with someone who breathes the same air.',
  ],
};

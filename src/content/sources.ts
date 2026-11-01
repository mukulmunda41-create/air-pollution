// Every figure on the site points at one of these. No source, no figure.
export const sources = {
  'who-ambient': {
    label: 'WHO',
    title: 'Ambient (outdoor) air pollution, fact sheet',
    publisher: 'World Health Organization',
    date: '24 October 2024',
    href: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health',
    used: '99% of people, 4.2 million deaths, causes of death, pollutant sources, what reduces pollution, the 300,000 lives estimate.',
  },
  'who-aqg': {
    label: 'WHO',
    title: 'WHO global air quality guidelines',
    publisher: 'World Health Organization',
    date: '22 September 2021',
    href: 'https://www.who.int/publications/i/item/9789240034228',
    used: 'Annual PM2.5 guideline of 5 µg/m³.',
  },
  'epa-pm': {
    label: 'US EPA',
    title: 'Particulate Matter (PM) Basics',
    publisher: 'United States Environmental Protection Agency',
    date: 'accessed 31 October 2026',
    href: 'https://www.epa.gov/pm-pollution/particulate-matter-pm-basics',
    used: 'Particle sizes compared with a hair, where particles come from, how far into the body they reach.',
  },
  'soga-2024': {
    label: 'State of Global Air',
    title: 'State of Global Air report 2024',
    publisher: 'Health Effects Institute, with UNICEF',
    date: '2024',
    href: 'https://www.stateofglobalair.org/resources/report/state-global-air-report-2024',
    used: 'More than 700,000 deaths of children under five linked to air pollution in 2021.',
  },
  beijing: {
    label: 'Beijing Municipal Government',
    title: "Beijing's annual average PM2.5 concentration meets standards for 3 consecutive years",
    publisher: 'Beijing Municipal Government',
    date: '30 May 2024',
    href: 'https://english.beijing.gov.cn/specials/livablegreenbeijing/livablegreennews/202405/t20240530_3698984.html',
    used: 'PM2.5 down 64.2% in 2023 compared with 2013. A government figure.',
  },
  london: {
    label: 'Mayor of London',
    title: 'London-wide Ultra Low Emission Zone One Year Report',
    publisher: 'Mayor of London and Transport for London',
    date: 'accessed 31 October 2026',
    href: 'https://www.london.gov.uk/programmes-strategies/environment-and-climate-change/environment-and-climate-change-publications/london-wide-ultra-low-emission-zone-one-year-report',
    used: 'Roadside nitrogen dioxide 27% lower across London in 2024 than modelled without the ULEZ.',
  },
  breathing: {
    label: 'Cleveland Clinic',
    title: 'Vital signs',
    publisher: 'Cleveland Clinic',
    date: 'accessed 31 October 2026',
    href: 'https://my.clevelandclinic.org/health/articles/10881-vital-signs',
    used: 'A resting adult breathes about 12 to 18 times a minute. The breath counter uses 12.',
  },
} as const;

export type SourceId = keyof typeof sources;
export const sourceList = Object.entries(sources).map(([id, s]) => ({ id: id as SourceId, ...s }));

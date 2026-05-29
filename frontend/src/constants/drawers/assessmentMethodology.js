/** Drawer and guide-page copy for assessment methodology, framework steps, and data sources. */

import { Bot, ChartColumn, CircleCheck, Search } from 'lucide-react';

/**
 * Structured copy for the methodology drawer and guide page.
 * Items provide card icons/copy, while `dataSources.categories` groups dataset metadata for expandable source lists.
 */
export const ASSESSMENT_METHODOLOGY_CONTENT = {
  title: 'Assessment Methodology',
  subtitle: 'How we evaluate circular economy initiatives',
  items: [
    {
      icon: Search,
      title: 'Semantic Analysis',
      description:
        'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
      accentBorder: '',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-gray-600',
    },
    {
      icon: Bot,
      title: 'AI Reasoning',
      description:
        'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
      accentBorder: '',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-emerald-600',
    },
    {
      icon: ChartColumn,
      title: 'Multi-Dimensional Scoring',
      description:
        'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
      accentBorder: '',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-(--color-success)',
    },
    {
      icon: CircleCheck,
      title: 'Integrity Validation',
      description:
        'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
      accentBorder: '',
      gradientFrom: '',
      gradientTo: '',
      iconBg: '',
      iconColor: 'text-(--color-warning)',
    },
  ],
  dataSources: {
    title: 'Data Sources',
    subtitle: 'Comprehensive dataset integration for circular economy insights',
    categories: [
      {
        name: 'Web-Scraped Datasets',
        icon: 'Globe',
        description: 'Real-time data from leading circular economy platforms',
        datasets: [
          {
            name: 'Cradle-to-Cradle Registry',
            source: 'c2ccertified.org',
            description: 'Certified products with circular design specifications',
            count: '4,000+ products',
          },
          {
            name: 'EMF Case Studies',
            source: 'ellenmacarthurfoundation.org',
            description: 'Foundation-curated circular business models and implementations',
            count: '200+ case studies',
          },
          {
            name: 'ECESP Good Practices',
            source: 'circulareconomy.europa.eu',
            description: 'European circular economy best practices and policy implementations',
            count: '500+ practices',
          },
          {
            name: 'Circle Economy Knowledge Hub',
            source: 'knowledge-hub.circle-economy.com',
            description: 'Urban and regional circular economy case studies',
            count: '300+ cases',
          },
          {
            name: 'Fashion for Good Innovation',
            source: 'fashionforgood.com',
            description: 'Sustainable fashion and textile innovation initiatives',
            count: '150+ innovators',
          },
          {
            name: 'Kalundborg Symbiosis',
            source: 'symbiosis.dk',
            description: 'Industrial symbiosis and resource exchange case studies',
            count: '50+ cases',
          },
          {
            name: 'Open Product Facts',
            source: 'openproductsfacts.org',
            description: 'Product sustainability and circular design information',
            count: '1M+ products',
          },
          {
            name: 'ReFED Solutions',
            source: 'insights.refed.org',
            description: 'Food waste reduction solutions and implementations',
            count: '1,000+ solutions',
          },
          {
            name: 'Metabolic Publications',
            source: 'metabolic.nl',
            description: 'Circular economy research and implementation reports',
            count: '60+ publications',
          },
          {
            name: 'Remanufacturing EU',
            source: 'remanufacturing.eu',
            description: 'European remanufacturing case studies and best practices',
            count: '100+ cases',
          },
          {
            name: 'WRAP Resources',
            source: 'wrap.ngo',
            description: 'UK circular economy case studies and implementation guides',
            count: '400+ resources',
          },
        ],
      },
      {
        name: 'PDF-Based Research',
        icon: 'FileText',
        description: 'Academic and institutional reports extracted for analysis',
        datasets: [
          {
            name: 'Circularity Gap Report 2025',
            source: 'circularity-gap.world',
            description: 'Global circularity metrics and country-level analysis',
            count: '180+ countries',
          },
          {
            name: 'EIPPCB BAT Conclusions',
            source: 'European Commission',
            description: 'Best Available Techniques for industrial circularity',
            count: '9 industrial sectors',
          },
          {
            name: 'SEI Construction Cases',
            source: 'wbcsd.org',
            description: 'Circular construction and building deconstruction cases',
            count: '17 case studies',
          },
          {
            name: 'WBCSD Business Cases',
            source: 'wbcsd.org',
            description: 'Corporate circular economy implementation examples',
            count: '30+ cases',
          },
          {
            name: 'EULAC Case Studies',
            source: 'EU-LAC Partnership',
            description: 'EU-Latin America circular economy cooperation cases',
            count: '7 initiatives',
          },
          {
            name: 'Global E-Waste Monitor',
            source: 'ewastemonitor.info',
            description: 'Global e-waste generation and recycling statistics',
            count: '190+ countries',
          },
        ],
      },
      {
        name: 'Statistical Databases',
        icon: 'Database',
        description: 'Quantitative data from international organizations',
        datasets: [
          {
            name: 'Eurostat Indicators',
            source: 'ec.europa.eu/eurostat',
            description: 'EU waste management and material efficiency metrics',
            count: '27 countries',
          },
          {
            name: 'OECD Statistics',
            source: 'data-explorer.oecd.org',
            description: 'OECD member resource efficiency and waste management',
            count: '38 countries',
          },
          {
            name: 'EPA TRI Database',
            source: 'epa.gov',
            description: 'US toxic release inventory and resource recovery data',
            count: '20,000+ facilities',
          },
          {
            name: 'UNEP Material Flows',
            source: 'unep.org',
            description: 'Global material footprint and waste generation data',
            count: '200+ countries',
          },
          {
            name: 'GHG Emissions Data',
            source: 'EDGAR/IEA',
            description: 'Historical greenhouse gas emissions by sector and country',
            count: '1970-2024 timeline',
          },
          {
            name: 'World Bank Projects',
            source: 'worldbank.org',
            description: 'Sustainable development and circular economy projects',
            count: '12,000+ projects',
          },
          {
            name: 'Data Europa',
            source: 'data.europa.eu',
            description: 'EU circular economy projects and statistics',
            count: '500+ datasets',
          },
        ],
      },
      {
        name: 'Specialized Datasets',
        icon: 'Target',
        description: 'Domain-specific circular economy data sources',
        datasets: [
          {
            name: 'GreenTechGuardians AI EarthHack',
            source: 'techandy42/GreenTechGuardians',
            description: 'Student-submitted circular economy solutions with AI analysis',
            count: '4,000+ solutions',
          },
          {
            name: 'Fashion Transparency Index',
            source: 'apparelcoalition.org',
            description: 'Brand transparency scores and supply chain circularity',
            count: '250+ brands',
          },
          {
            name: 'iFixit Repairability',
            source: 'ifixit.com',
            description: 'Product repairability scores and repair guides',
            count: '8 product categories',
          },
          {
            name: 'Kaggle LCA Datasets',
            source: 'kaggle.com',
            description: 'Life cycle assessment data for products and supply chains',
            count: '3 major datasets',
          },
          {
            name: 'Mendeley Research Data',
            source: 'Mendeley Data',
            description: 'Academic research on sustainability and circular economy',
            count: '5 research collections',
          },
          {
            name: 'Environmental Sustainability',
            source: 'UNDP HDR',
            description: 'Country-level environmental sustainability indicators',
            count: '190+ countries',
          },
        ],
      },
    ],
  },
};

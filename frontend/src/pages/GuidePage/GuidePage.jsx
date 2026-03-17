import {
  BarChart3,
  BookCopy,
  Bot,
  ChartColumn,
  ChartSpline,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleDollarSign,
  ClipboardMinus,
  ClipboardPenLine,
  Lightbulb,
  Link,
  Search,
  Settings,
  Target,
  TriangleAlert,
} from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';

// Import parameter guidance data
const parameterGuidance = {
  public_participation: {
    name: 'Public Participation',
    category: 'Access Value (Social & Participation)',
    weight: 0.15,
    weightPercent: '15%',
    definition: 'Measures how easily various stakeholders can engage with your circular system.',
    methodology:
      'Based on barrier analysis: technical knowledge required, geographic access, cost of participation, time commitment.',
    calibration:
      'Consider: Who can participate? What do they need to do? What prevents participation?',
    scale: [
      {
        score: 90,
        label: 'Universal Access',
        description: 'Zero barriers to entry, widely accessible',
      },
      {
        score: 75,
        label: 'Easy Participation',
        description: 'Minor barriers, most people can engage',
      },
      {
        score: 60,
        label: 'Moderate Participation',
        description: 'Some effort required, selective engagement',
      },
      {
        score: 40,
        label: 'Limited Participation',
        description: 'Significant barriers, restricted groups',
      },
      {
        score: 20,
        label: 'Expert-Only Access',
        description: 'Highly specialized, limited to professionals',
      },
    ],
    examples: [
      {
        score: 85,
        case: 'Municipal curbside composting with free bins',
        reason: 'Effortless - just put waste in bin',
      },
      {
        score: 70,
        case: 'Product take-back requiring online registration',
        reason: 'Small barrier - registration needed',
      },
      {
        score: 50,
        case: 'Product take-back requiring shipping',
        reason: 'Moderate effort - shipping costs',
      },
      {
        score: 25,
        case: 'Industrial recycling partnerships',
        reason: 'B2B only, not for consumers',
      },
    ],
  },
  infrastructure: {
    name: 'Infrastructure & Accessibility',
    category: 'Access Value (Social & Participation)',
    weight: 0.15,
    weightPercent: '15%',
    definition:
      'Existing infrastructure availability, geographic reach, and logistical feasibility.',
    methodology:
      'Evaluates collection networks, processing facilities, distribution systems, and transportation logistics.',
    calibration:
      'Consider: What infrastructure already exists? How much needs to be built? Geographic gaps?',
    scale: [
      {
        score: 85,
        label: 'Excellent Infrastructure',
        description: 'Well-developed systems widely available',
      },
      { score: 70, label: 'Good Infrastructure', description: 'Adequate systems in major areas' },
      {
        score: 50,
        label: 'Moderate Infrastructure',
        description: 'Some systems available, gaps exist',
      },
      {
        score: 30,
        label: 'Limited Infrastructure',
        description: 'Few existing systems, building needed',
      },
      { score: 10, label: 'No Infrastructure', description: 'Would require entirely new systems' },
    ],
    examples: [
      {
        score: 80,
        case: 'Urban area with existing waste collection',
        reason: 'Can piggyback on existing systems',
      },
      {
        score: 55,
        case: 'Rural area with basic infrastructure',
        reason: 'Some systems available but sparse',
      },
      {
        score: 30,
        case: 'Emerging market with limited systems',
        reason: 'Significant infrastructure investment needed',
      },
      {
        score: 15,
        case: 'Remote region with no infrastructure',
        reason: 'Would build systems from scratch',
      },
    ],
  },
  market_price: {
    name: 'Market Price',
    category: 'Embedded Value (Economic & Material)',
    weight: 0.2,
    weightPercent: '20%',
    definition:
      'Economic value of recovered materials, revenue potential, and market demand strength.',
    methodology:
      'Considers commodity pricing, market size, demand volatility, and revenue predictability.',
    calibration:
      'Consider: What is the material worth? How stable is the market? Is demand growing or declining?',
    scale: [
      {
        score: 90,
        label: 'High Value',
        description: 'Strong market demand, stable premium pricing',
      },
      {
        score: 70,
        label: 'Good Value',
        description: 'Solid market, reasonable price, growing demand',
      },
      { score: 50, label: 'Moderate Value', description: 'Viable economics, market varies' },
      { score: 30, label: 'Low Value', description: 'Limited market, requires incentives' },
      { score: 10, label: 'Minimal Value', description: 'Barely profitable, heavily subsidized' },
    ],
    examples: [
      {
        score: 85,
        case: 'Aluminum recycling',
        reason: 'High commodity value, stable market, always in demand',
      },
      {
        score: 60,
        case: 'Plastic recycling',
        reason: 'Moderate value, market volatility, fluctuating demand',
      },
      {
        score: 40,
        case: 'Paper recycling',
        reason: 'Lower margins, market dependent on paper consumption',
      },
      { score: 20, case: 'Textile waste recovery', reason: 'Emerging market, low current value' },
    ],
  },
  maintenance: {
    name: 'Maintenance',
    category: 'Embedded Value (Economic & Material)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Ease of upkeep, cost of maintenance, and system durability.',
    methodology:
      'Evaluates technical complexity, required expertise, parts availability, and operational lifespan.',
    calibration:
      'Consider: How often does it break down? How expensive is maintenance? Is it easy to repair?',
    scale: [
      {
        score: 85,
        label: 'Very Low Maintenance',
        description: 'Minimal upkeep, highly durable, self-sustaining',
      },
      { score: 70, label: 'Low Maintenance', description: 'Occasional checkups, long lifespan' },
      { score: 50, label: 'Moderate Maintenance', description: 'Regular servicing required' },
      { score: 30, label: 'High Maintenance', description: 'Frequent repairs, expert needed' },
      {
        score: 10,
        label: 'Very High Maintenance',
        description: 'Constant upkeep, expensive, unreliable',
      },
    ],
    examples: [
      {
        score: 80,
        case: 'Simple mechanical sorting',
        reason: 'Straightforward design, minimal breakdowns',
      },
      {
        score: 55,
        case: 'Standard processing facility',
        reason: 'Regular maintenance routine required',
      },
      {
        score: 30,
        case: 'Specialized chemical processing',
        reason: 'Complex systems, frequent calibration',
      },
      {
        score: 15,
        case: 'Experimental technology',
        reason: 'Prototype stage, frequent adjustments needed',
      },
    ],
  },
  uniqueness: {
    name: 'Uniqueness',
    category: 'Embedded Value (Economic & Material)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Rarity of materials, competitive advantage, and innovation level.',
    methodology:
      'Assesses intellectual property, differentiation from competitors, and market exclusivity.',
    calibration:
      'Consider: Is this patented? Do competitors do this? How innovative is the approach?',
    scale: [
      {
        score: 90,
        label: 'Highly Unique',
        description: 'Proprietary technology, strong competitive moat',
      },
      {
        score: 70,
        label: 'Differentiated',
        description: 'Novel approach, some competitive advantage',
      },
      {
        score: 50,
        label: 'Somewhat Unique',
        description: 'Some differentiation, others doing similar',
      },
      { score: 30, label: 'Conventional', description: 'Standard approach, many competitors' },
      { score: 10, label: 'Commodity', description: 'No differentiation, highly commoditized' },
    ],
    examples: [
      {
        score: 85,
        case: 'Patented material recovery process',
        reason: 'Protected intellectual property',
      },
      {
        score: 60,
        case: 'Novel supply chain model',
        reason: 'Different approach, some imitators emerging',
      },
      {
        score: 40,
        case: 'Improved recycling technique',
        reason: 'Incremental innovation, multiple similar solutions',
      },
      {
        score: 15,
        case: 'Standard commodity recycling',
        reason: 'No differentiation, highly competitive',
      },
    ],
  },
  size_efficiency: {
    name: 'Size Efficiency',
    category: 'Processing Value (Technical & Operational)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Physical footprint, storage requirements, and transportation efficiency.',
    methodology:
      'Evaluates space requirements, scalability constraints, and logistics optimization.',
    calibration:
      'Consider: How much space is needed? How easily can it scale? Transportation friendly?',
    scale: [
      {
        score: 90,
        label: 'Extremely Efficient',
        description: 'Minimal footprint, digital or virtual',
      },
      {
        score: 75,
        label: 'Very Efficient',
        description: 'Compact facilities, limited space needs',
      },
      { score: 50, label: 'Moderate Footprint', description: 'Standard facility size' },
      { score: 30, label: 'Large Footprint', description: 'Significant space requirements' },
      { score: 10, label: 'Highly Space-Intensive', description: 'Massive infrastructure needs' },
    ],
    examples: [
      { score: 92, case: 'Digital material marketplace', reason: 'No physical footprint' },
      { score: 75, case: 'Compact sorting facility', reason: 'Optimized layout, minimal space' },
      { score: 50, case: 'Standard recycling center', reason: 'Typical warehouse size' },
      { score: 25, case: 'Large processing plant', reason: 'Substantial real estate requirements' },
    ],
  },
  chemical_safety: {
    name: 'Chemical Safety',
    category: 'Processing Value (Technical & Operational)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Environmental hazards and health risks (scored as inverse: higher = safer).',
    methodology: 'Assesses chemical exposure, toxicity levels, waste hazards, and disposal safety.',
    calibration:
      'Consider: How toxic are the materials? What are health risks? Disposal challenges?',
    scale: [
      {
        score: 90,
        label: 'Very Safe',
        description: 'Inert materials, minimal hazards, clean processes',
      },
      { score: 75, label: 'Generally Safe', description: 'Low hazards with standard precautions' },
      {
        score: 50,
        label: 'Manageable Hazards',
        description: 'Moderate risks, requires safety protocols',
      },
      {
        score: 30,
        label: 'Significant Hazards',
        description: 'High toxicity, strict protocols needed',
      },
      {
        score: 10,
        label: 'Extreme Hazards',
        description: 'Highly toxic, complex disposal required',
      },
    ],
    examples: [
      {
        score: 88,
        case: 'Paper and cardboard recycling',
        reason: 'Inert material, no chemical hazards',
      },
      {
        score: 70,
        case: 'Glass and metal recycling',
        reason: 'Generally safe, minimal chemical exposure',
      },
      {
        score: 50,
        case: 'Plastic recycling with cleaning',
        reason: 'Mild chemical exposure with protocols',
      },
      {
        score: 25,
        case: 'Electronic waste processing',
        reason: 'Heavy metals present, strict handling required',
      },
    ],
  },
  tech_readiness: {
    name: 'Tech Readiness',
    category: 'Processing Value (Technical & Operational)',
    weight: 0.1,
    weightPercent: '10%',
    definition:
      'Technology maturity level and implementation complexity (scored as inverse: higher = ready).',
    methodology: 'Based on TRL (Technology Readiness Level): 1-3=Lab, 4-6=Pilot, 7-9=Deployment.',
    calibration: 'Consider: Is this proven? Has it been tested? How complex to implement?',
    scale: [
      {
        score: 90,
        label: 'Deployment Ready',
        description: 'Proven technology, TRL 8-9, ready to scale',
      },
      { score: 75, label: 'Proven & Tested', description: 'Pilot demonstrated, TRL 6-7' },
      { score: 50, label: 'Demonstrated', description: 'Lab scale working, TRL 4-5' },
      { score: 30, label: 'Conceptual', description: 'Theory proven, TRL 2-3' },
      { score: 10, label: 'Emerging Concept', description: 'Theoretical stage, TRL 1' },
    ],
    examples: [
      {
        score: 88,
        case: 'Established recycling process',
        reason: 'Deployed globally for 20+ years',
      },
      {
        score: 70,
        case: 'Advanced sorting technology',
        reason: 'Several commercial installations running',
      },
      { score: 50, case: 'Pilot-stage separation tech', reason: 'Working at demonstration scale' },
      { score: 25, case: 'Lab-proven chemical process', reason: 'Early stage, needs optimization' },
    ],
  },
};

const SECTIONS = [
  { id: 'assessment-methodology', title: 'Assessment Methodology', icon: ChartSpline },
  { id: 'business-problem', title: 'Business Problem Guide', icon: Target },
  { id: 'business-solution', title: 'Business Solution Guide', icon: Lightbulb },
  { id: 'evaluation-criteria', title: 'Evaluation Criteria', icon: ClipboardMinus },
  { id: 'evaluation-parameters', title: 'Evaluation Parameters', icon: BarChart3 },
  { id: 'parameter-details', title: 'Parameter Details', icon: Settings },
  { id: 'sample-test-cases', title: 'Sample Test Cases', icon: ClipboardPenLine },
];

// Navigation component with HeroUI-inspired aesthetic
const Navigation = ({ activeSection, onSectionClick, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const getProgress = (sectionId) => {
    const index = SECTIONS.findIndex((s) => s.id === sectionId);
    return ((index + 1) / SECTIONS.length) * 100;
  };

  const NavContent = ({ isMobile = false }) => (
    <>
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        const progress = getProgress(section.id);

        return (
          <button
            key={section.id}
            onClick={() => {
              onSectionClick(section.id);
              if (isMobile) setIsMobileMenuOpen(false);
            }}
            className={`group flex items-center gap-3 w-full py-2 text-left transition-all duration-200 relative ${
              isActive ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {/* Active indicator line */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500 transition-all duration-200 ${
                isActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            <span
              className={`text-sm pl-4 transition-all duration-200 ${
                isActive ? 'translate-x-0' : 'group-hover:translate-x-0.5'
              }`}
            >
              {section.title}
            </span>
          </button>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center w-1 h-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              On this page
            </span>
          </div>
          <div className="space-y-0.5 border-l border-gray-200">
            <NavContent />
          </div>
        </div>
      </nav>

      {/* Mobile Dropdown Navigation */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-gray-200 mb-8">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-6 h-6 shrink-0">
              {/* Circular progress indicator */}
              <svg className="w-6 h-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 10}`}
                  strokeDashoffset={`${2 * Math.PI * 10 * (1 - getProgress(activeSection) / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {SECTIONS.find((s) => s.id === activeSection) &&
                  React.createElement(SECTIONS.find((s) => s.id === activeSection).icon, {
                    className: 'text-emerald-600',
                    size: 12,
                  })}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {SECTIONS.find((s) => s.id === activeSection)?.title}
            </span>
          </div>
          {isMobileMenuOpen ? (
            <ChevronUp className="text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-400" size={20} />
          )}
        </button>

        {/* Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white shadow-lg">
            <div className="py-2 px-4 space-y-0.5 max-h-[60vh] overflow-y-auto border-l border-gray-200 ml-4">
              <NavContent isMobile={true} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

Navigation.propTypes = {
  activeSection: PropTypes.string.isRequired,
  onSectionClick: PropTypes.func.isRequired,
  isMobileMenuOpen: PropTypes.bool.isRequired,
  setIsMobileMenuOpen: PropTypes.func.isRequired,
};

// Assessment Methodology Section
const AssessmentMethodologySection = () => {
  const METHODOLOGY_ITEMS = [
    {
      icon: <Search size={20} />,
      title: 'Semantic Analysis',
      description:
        'Uses OpenAI text-embedding-3-small (1536 dimensions) to find the most relevant projects matching your business model and problem space.',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: <Bot size={20} />,
      title: 'AI Reasoning',
      description:
        'GPT-4o-mini analyzes your submission against 3 similar cases with strict evidence-based reasoning and integrity checking.',
      borderColor: 'border-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: <ChartColumn size={20} />,
      title: 'Multi-Dimensional Scoring',
      description:
        'Evaluates across 8 weighted parameters covering material innovation, circularity loops, market viability, and environmental impact.',
      borderColor: 'border-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      icon: <CircleCheck size={20} />,
      title: 'Integrity Validation',
      description:
        'Cross-references your self-assessed scores against real-world benchmarks to identify overestimations and provide honest feedback.',
      borderColor: 'border-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <section id="assessment-methodology" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-4">
          <ChartSpline size={16} />
          <span>Assessment Methodology</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Our AI-powered evaluation framework
        </h2>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          This evaluation uses a proprietary AI-powered framework combining vector similarity search
          with GPT-4o-mini reasoning against a database of{' '}
          <strong className="text-gray-900">4,000+ high-quality circular economy projects</strong>.
        </p>

        <div className="space-y-4 mb-8">
          {METHODOLOGY_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 border-l-4 rounded-lg ${item.borderColor} ${item.bgColor} transition-all duration-200 hover:shadow-md`}
            >
              <h4 className="flex items-center gap-2 mb-2 text-base font-bold text-gray-800">
                {item.icon} {item.title}
              </h4>
              <p className="text-sm leading-relaxed text-gray-700 m-0">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 mb-8">
          <h4 className="flex items-center gap-2 mb-3 text-base font-bold text-emerald-800">
            <BookCopy size={20} /> Data Source
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed m-0">
            <strong>GreenTechGuardians AI EarthHack Dataset:</strong> A curated collection of{' '}
            <strong>4,000+ high-quality</strong> circular economy solutions (filtered from 1,300)
            spanning waste reduction, resource optimization, renewable energy, sustainable
            materials, and regenerative agriculture across multiple industries and geographic
            regions.
          </p>
        </div>

        <div className="p-5 rounded-xl border-l-4 border-orange-500 bg-orange-50">
          <p className="text-sm text-gray-700 leading-relaxed m-0">
            <strong className="flex items-center gap-2 mb-2 text-orange-800">
              <TriangleAlert size={16} /> Disclaimer:
            </strong>
            This assessment is designed to provide{' '}
            <strong>constructive feedback for early-stage ideation</strong>. Scores reflect
            alignment with established circular economy principles and should be used as guidance,
            not as definitive validation of commercial viability.
          </p>
        </div>
      </div>
    </section>
  );
};

// Business Problem Section
const BusinessProblemSection = () => {
  const PROBLEM_ELEMENTS = [
    {
      title: 'Environmental Impact',
      description:
        'Specific waste, pollution, or resource depletion issue (e.g., "8M tons of plastic waste entering oceans annually").',
    },
    {
      title: 'Quantified Scale',
      description:
        'Use real numbers, percentages, or measurements to show magnitude (tons, percent of market, number of people affected).',
    },
    {
      title: 'Current Gaps',
      description:
        'Why existing solutions fail (cost barriers, infrastructure limits, behavior challenges, regulation issues).',
    },
    {
      title: 'Stakeholders Affected',
      description:
        'Who experiences this problem and how (consumers, businesses, communities, ecosystems).',
    },
    {
      title: 'Geographic Context',
      description: 'Where this problem is most acute (local, regional, national, global).',
    },
    {
      title: 'Urgency Indicators',
      description:
        'Why this needs solving now (regulatory pressure, market demand, environmental tipping points).',
    },
  ];

  const PROBLEM_WRITING_TIPS = [
    'Start with a compelling statistic or fact.',
    'Use specific numbers instead of vague terms.',
    'Connect the problem to economic or social costs.',
    'Reference industry standards or regulations when relevant.',
    'Cite sources if available (e.g., EPA, industry studies).',
  ];

  const PROBLEM_EXAMPLE =
    'Single-use plastic packaging creates 8 million tons of ocean waste annually, disrupting marine ecosystems and food chains. Current alternatives are cost-prohibitive (> $2/unit) or require industrial composting infrastructure that 75% of municipalities lack. This leaves a gap between demand for sustainable packaging and practical implementation at scale.';

  return (
    <section id="business-problem" className="scroll-mt-20 lg:scroll-mt-6">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
          <Target size={16} />
          <span>Business Problem</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Environmental or circular economy challenge
        </h2>
      </div>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Describe the{' '}
          <strong className="text-gray-900">environmental or circular economy challenge</strong>{' '}
          your business addresses.
        </p>

        <div className="p-6 border border-emerald-200 bg-emerald-50 rounded-xl mb-8">
          <h4 className="mb-4 text-base font-bold text-emerald-800">Essential Elements</h4>
          <ul className="space-y-3 m-0">
            {PROBLEM_ELEMENTS.map(({ title, description }) => (
              <li key={title} className="pl-4 text-sm border-l-2 border-emerald-400 list-none">
                <strong className="text-emerald-900 block mb-1">{title}</strong>
                <p className="text-gray-700 text-sm m-0">{description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 border border-blue-200 bg-blue-50 rounded-xl mb-8">
          <h4 className="mb-4 text-base font-bold text-blue-800">Writing Tips</h4>
          <ul className="space-y-2 m-0 pl-0">
            {PROBLEM_WRITING_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-sm text-gray-700 list-none">
                <span className="font-bold text-blue-500 text-lg leading-none">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-8">
          <h4 className="mb-3 text-base font-bold text-indigo-800">Example Statement</h4>
          <p className="p-5 text-sm italic leading-relaxed text-gray-700 border-l-4 border-indigo-500 rounded-lg bg-indigo-50 m-0">
            {PROBLEM_EXAMPLE}
          </p>
        </div>

        <div className="p-4 text-sm italic text-gray-600 bg-gray-100 rounded-lg border border-gray-200">
          ‼ ️ <strong>Minimum 200 characters required</strong>
        </div>
      </div>
    </section>
  );
};

// Business Solution Section
const BusinessSolutionSection = () => {
  const SOLUTION_COMPONENTS = [
    {
      title: 'Materials and Inputs',
      description:
        'Exact materials used with specifications (post-consumer PET, agricultural hemp fiber, recycled aluminum).',
    },
    {
      title: 'Process and Technology',
      description:
        'Step-by-step transformation process and standards met (e.g., mechanical sorting, washing, pelletizing at 230C).',
    },
    {
      title: 'Business Model and Logistics',
      description:
        'How you collect, process, and distribute (hub-and-spoke, delivery-as-a-service, reverse logistics network).',
    },
    {
      title: 'Circularity Loop',
      description:
        'How materials return to use (composted material sold to farms, returning to feedstock for your product).',
    },
    {
      title: 'Key Performance Metrics',
      description:
        'Quantified results (recovery rate, unit cost, composting time, carbon footprint vs virgin materials).',
    },
    {
      title: 'Partnerships and Infrastructure',
      description:
        'Key collaborators (waste management partners, processing facilities, certification bodies, distribution channels).',
    },
    {
      title: 'Scalability Path',
      description:
        'How the solution grows (pilot to regional to national; target units per month by year 2).',
    },
    {
      title: 'Economic Viability',
      description: 'Revenue model, cost structure, and comparison to conventional alternatives.',
    },
  ];

  const SOLUTION_PITFALLS = [
    'Avoid vague descriptions; provide specific materials and processes.',
    'Avoid missing technical details; include equipment, temperatures, and cycle times.',
    'Avoid absent metrics; include recovery rates, costs, and carbon impact.',
    'Avoid unclear loop closure; explain how materials re-enter the system.',
  ];

  const SOLUTION_PRO_TIPS = [
    'Use industry-standard terminology and note certifications.',
    'Include both environmental and economic metrics.',
    'Mention regulatory compliance (FDA, EPA, ISO, etc.).',
    'Compare to conventional alternatives (cost, performance, impact).',
    'Show real-world validation (pilots, customers, third-party testing).',
  ];

  const SOLUTION_EXAMPLE =
    'We convert agricultural hemp waste into compostable mailers and run a hub-and-spoke collection model. Customers use prepaid mailers; 15 regional hubs aggregate returns; certified composters process 95% of materials within 90 days into soil amendments. Those amendments are sold back to hemp farms, creating a closed loop. Cost: $0.85 per unit at scale; home-compostable in 180 days.';

  return (
    <section id="business-solution" className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-teal-100">
          <Lightbulb className="text-teal-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Business Solution Guide</h2>
          <p className="text-sm text-gray-600">How your business solves the problem</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="leading-relaxed text-gray-700">
          Describe <strong>how your business solves the problem</strong> with technical details
          about materials, processes, partnerships, and outcomes.
        </p>

        <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
          <h4 className="mb-3 text-base font-bold text-teal-700">Critical Components</h4>
          <ul className="space-y-2">
            {SOLUTION_COMPONENTS.map(({ title, description }) => (
              <li key={title} className="border-l-2 border-teal-400 pl-3 text-sm">
                <strong className="text-teal-900">{title}</strong>
                <p className="text-gray-600 text-sm mt-0.5">{description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h4 className="mb-3 text-base font-bold text-orange-700">Common Pitfalls</h4>
          <ul className="space-y-1">
            {SOLUTION_PITFALLS.map((pitfall) => (
              <li key={pitfall} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-orange-500 font-bold">×</span>
                <span>{pitfall}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <h4 className="mb-3 text-base font-bold text-emerald-700">Pro Tips</h4>
          <ul className="space-y-1">
            {SOLUTION_PRO_TIPS.map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-base font-bold text-indigo-700">Example Statement</h4>
          <p className="p-3 italic text-sm leading-relaxed text-gray-600 rounded-lg bg-indigo-50 border border-l-4 border-indigo-300 border-l-indigo-500">
            {SOLUTION_EXAMPLE}
          </p>
        </div>

        <p className="text-sm italic text-gray-500 p-3 bg-gray-100 rounded-lg">
          ‼ ️ <strong>Minimum 200 characters required</strong>
        </p>
      </div>
    </section>
  );
};

// Evaluation Criteria Section
const EvaluationCriteriaSection = () => {
  const METRICS = [
    { number: 3, label: 'Core Value Types', color: 'blue' },
    { number: 8, label: 'Evaluation Factors', color: 'emerald' },
    { number: 100, label: 'Maximum Score', color: 'emerald' },
  ];

  const VALUE_SECTIONS = [
    {
      title: 'Access Value',
      icon: <Link size={24} />,
      color: 'blue',
      description: 'Evaluates accessibility and participation aspects',
      factors: [
        {
          title: 'Public Participation',
          description:
            'Measures how easily stakeholders, communities, and end-users can engage with and contribute to the circular system.',
        },
        {
          title: 'Infrastructure & Accessibility',
          description:
            'Assesses the availability of necessary infrastructure and ease of access to circular economy resources and processes.',
        },
      ],
      gridCols: 'md:grid-cols-2',
      borderColor: 'border-blue-500',
    },
    {
      title: 'Embedded Value',
      icon: <CircleDollarSign size={24} />,
      color: 'emerald',
      description: 'Evaluates inherent and economic value of resources',
      factors: [
        {
          title: 'Market Price',
          description:
            'Evaluates the economic value and market demand for recovered or repurposed materials.',
        },
        {
          title: 'Maintenance',
          description:
            'Assesses the ease and cost of maintaining products, materials, or systems throughout their lifecycle.',
        },
        {
          title: 'Uniqueness',
          description:
            'Measures the rarity, specialty, or distinctive value of materials and their potential for reuse.',
        },
      ],
      gridCols: 'md:grid-cols-3',
      borderColor: 'border-emerald-600',
    },
    {
      title: 'Processing Value',
      icon: <Settings size={24} />,
      color: 'teal',
      description: 'Evaluates technical and operational factors',
      factors: [
        {
          title: 'Size',
          description:
            'Considers the physical dimensions and volume, affecting handling, storage, and transportation efficiency.',
        },
        {
          title: 'Chemical Toxicity',
          description:
            'Assesses potential environmental and health hazards, impacting safe processing and disposal methods.',
        },
        {
          title: 'Technology Needed',
          description:
            'Evaluates the complexity and availability of technology required for effective processing and recovery.',
        },
      ],
      gridCols: 'md:grid-cols-3',
      borderColor: 'border-teal-600',
    },
  ];

  const CALCULATION_STEPS = [
    {
      number: 1,
      title: 'AI Analysis',
      description:
        'Our machine learning model analyzes your business description against each of the 8 factors',
    },
    {
      number: 2,
      title: 'Weighted Scoring',
      description: 'Each value type contributes proportionally to the overall circularity score',
    },
    {
      number: 3,
      title: 'Comprehensive Report',
      description:
        'Receive detailed insights, strengths, and actionable recommendations for improvement',
    },
  ];

  return (
    <section id="evaluation-criteria" className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-100">
          <ClipboardMinus className="text-emerald-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Evaluation Criteria</h2>
          <p className="text-sm text-gray-600">Three core value dimensions with specific factors</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-gray-600 leading-relaxed">
          Our AI-powered evaluation framework assesses business ideas across{' '}
          <strong>three core value dimensions</strong>, each comprising specific factors.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {METRICS.map((metric, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-center border ${
                metric.color === 'blue'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              <div
                className={`text-2xl font-bold ${
                  metric.color === 'blue' ? 'text-blue-600' : 'text-emerald-600'
                }`}
              >
                {metric.number}
              </div>
              <div className="text-xs text-gray-600 font-medium mt-1">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {VALUE_SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border-l-4 ${section.borderColor} ${
                section.color === 'blue'
                  ? 'bg-blue-50'
                  : section.color === 'emerald'
                    ? 'bg-emerald-50'
                    : 'bg-teal-50'
              }`}
            >
              <div className="flex items-start gap-2 mb-2">
                <div
                  className={`mt-0.5 ${
                    section.color === 'blue'
                      ? 'text-blue-600'
                      : section.color === 'emerald'
                        ? 'text-emerald-600'
                        : 'text-teal-600'
                  }`}
                >
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-bold mb-0.5 ${
                      section.color === 'blue'
                        ? 'text-blue-700'
                        : section.color === 'emerald'
                          ? 'text-emerald-700'
                          : 'text-teal-700'
                    }`}
                  >
                    {section.title}
                  </h4>
                  <p className="text-xs text-gray-600">{section.description}</p>
                </div>
              </div>
              <div className={`grid grid-cols-1 gap-2 mt-3 ${section.gridCols}`}>
                {section.factors.map((factor, factorIdx) => (
                  <div key={factorIdx} className="p-2 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900">{factor.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
          <h4 className="font-bold text-amber-900 mb-3 text-base">How We Calculate Your Score</h4>
          <div className="space-y-2">
            {CALCULATION_STEPS.map((step) => (
              <div key={step.number} className="flex items-start gap-3">
                <div className="flex items-center justify-center shrink-0 w-6 h-6 font-bold text-white rounded-full bg-amber-600 text-sm">
                  {step.number}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">{step.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Evaluation Parameters Section
const EvaluationParametersSection = () => {
  const factorDefinitions = {
    public_participation: {
      title: 'Public Participation',
      category: 'Access Value',
      desc: 'Measures how easily stakeholders can engage with your circular system.',
    },
    infrastructure: {
      title: 'Infrastructure & Accessibility',
      category: 'Access Value',
      desc: 'Existing infrastructure availability, geographic reach, and logistical feasibility.',
    },
    market_price: {
      title: 'Market Price',
      category: 'Embedded Value',
      desc: 'Economic value of recovered materials, revenue potential, and market demand strength.',
    },
    maintenance: {
      title: 'Maintenance',
      category: 'Embedded Value',
      desc: 'Ease of upkeep, cost of maintenance, and system durability.',
    },
    uniqueness: {
      title: 'Uniqueness',
      category: 'Embedded Value',
      desc: 'Rarity of materials, competitive advantage, and innovation level.',
    },
    size_efficiency: {
      title: 'Size Efficiency',
      category: 'Processing Value',
      desc: 'Physical footprint, storage requirements, and transportation efficiency.',
    },
    chemical_safety: {
      title: 'Chemical Safety',
      category: 'Processing Value',
      desc: 'Environmental hazards and health risks (scored as inverse: higher = safer).',
    },
    tech_readiness: {
      title: 'Tech Readiness',
      category: 'Processing Value',
      desc: 'Technology maturity level and implementation complexity (scored as inverse: higher = ready).',
    },
  };

  return (
    <section id="evaluation-parameters" className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-100">
          <BarChart3 className="text-emerald-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Evaluation Parameters Guide</h2>
          <p className="text-sm text-gray-600">Factors used to evaluate circularity potential</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="leading-relaxed text-gray-600">
          These are the factors we use to evaluate circularity potential. Use the definitions to
          align your self-assessed scores with our scoring model.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(factorDefinitions).map(([key, factor]) => (
            <div key={key} className="p-4 border border-emerald-200 rounded-xl bg-emerald-50">
              <h4 className="text-base font-bold text-emerald-700 mb-1">{factor.title}</h4>
              <p className="text-xs text-emerald-600 font-medium mb-2">
                Category: {factor.category}
              </p>
              <p className="text-sm leading-relaxed text-gray-600">{factor.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs italic text-gray-500 p-3 bg-gray-100 rounded-lg">
          💡 <strong>Stronger detail helps the model</strong> differentiate between nearby scores.
        </p>
      </div>
    </section>
  );
};

// Parameter Details Section
const ParameterDetailsSection = () => {
  return (
    <section id="parameter-details" className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-100">
          <Settings className="text-emerald-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Parameter Details</h2>
          <p className="text-sm text-gray-600">Comprehensive scoring guidance for each parameter</p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(parameterGuidance).map(([key, guidance]) => (
          <div key={key} className="p-6 border border-gray-200 rounded-xl bg-white">
            <div className="flex flex-col items-start justify-between gap-4 mb-5 sm:flex-row">
              <div>
                <h3 className="mb-1 text-xl font-bold text-emerald-700">{guidance.name}</h3>
                <p className="text-sm font-medium text-emerald-600">{guidance.category}</p>
              </div>
              {guidance.weight && (
                <div className="flex items-center justify-center px-3 py-1 text-sm font-bold border-2 rounded-lg border-emerald-300 bg-emerald-100 text-emerald-700 whitespace-nowrap">
                  Weight: {guidance.weightPercent}
                </div>
              )}
            </div>

            <div className="space-y-4 text-sm leading-relaxed">
              {guidance.definition && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">Definition</p>
                  <p className="text-gray-600">{guidance.definition}</p>
                </div>
              )}
              {guidance.methodology && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">Methodology</p>
                  <p className="text-gray-600">{guidance.methodology}</p>
                </div>
              )}
              {guidance.calibration && (
                <div>
                  <p className="mb-1 font-bold text-emerald-700">Calibration</p>
                  <p className="text-gray-700">{guidance.calibration}</p>
                </div>
              )}
            </div>

            {guidance.scale && (
              <div className="mt-6 p-4 border border-emerald-200 rounded-xl bg-emerald-50">
                <h4 className="mb-3 text-base font-bold text-emerald-700">Score Guide</h4>
                <div className="space-y-2">
                  {guidance.scale.map(({ score, label, description }) => (
                    <div key={`${score}-${label}`} className="pl-3 border-l-2 border-emerald-400">
                      <p className="text-sm font-semibold text-emerald-900">
                        {score} - {label}
                      </p>
                      <p className="text-xs text-gray-600">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {guidance.examples && (
              <div className="mt-4 p-4 border border-blue-200 rounded-xl bg-blue-50">
                <h4 className="mb-3 text-base font-bold text-blue-700">Benchmarks</h4>
                <div className="space-y-2">
                  {guidance.examples.map(({ score, case: exampleCase, reason }, idx) => (
                    <div
                      key={`${exampleCase}-${score}-${idx}`}
                      className="pl-3 border-l-2 border-blue-400"
                    >
                      <p className="text-sm font-semibold text-blue-900">
                        {exampleCase} {score && `(${score})`}
                      </p>
                      {reason && <p className="text-xs text-gray-600">{reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

// Sample Test Cases Section
const SampleTestCasesSection = () => {
  return (
    <section id="sample-test-cases" className="scroll-mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-100">
          <ClipboardPenLine className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Sample Test Cases</h2>
          <p className="text-sm text-gray-600">Pre-filled business model examples</p>
        </div>
      </div>

      <div className="space-y-6">
        <p className="leading-relaxed text-gray-600">
          <strong>Test Cases</strong> are pre-filled form submissions representing real circular
          economy business models. They help you:
        </p>
        <ul className="ml-3 space-y-2">
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <span className="font-bold text-blue-500">→</span>
            <span>See what good problem/solution descriptions look like</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <span className="font-bold text-blue-500">→</span>
            <span>Understand parameter scoring in real-world contexts</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-gray-600">
            <span className="font-bold text-blue-500">→</span>
            <span>Quickly test the evaluation framework</span>
          </li>
        </ul>

        <div className="pt-2">
          <h3 className="mb-3 text-base font-bold text-gray-900">How They Work</h3>
          <ol className="space-y-2">
            {[
              { num: 1, title: 'Select', desc: 'Pick any test case from the dropdown' },
              { num: 2, title: 'Auto-fill', desc: 'Your form populates automatically' },
              { num: 3, title: 'Submit', desc: 'Click "Get Evaluation" to see scores' },
              { num: 4, title: 'Learn', desc: 'Review the evaluation against known results' },
            ].map((step) => (
              <li key={step.num} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="flex items-center justify-center shrink-0 w-6 h-6 text-xs font-bold text-blue-600 bg-blue-100 rounded-full">
                  {step.num}
                </span>
                <div>
                  <strong>{step.title}:</strong> {step.desc}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
          <p className="flex items-start gap-2 m-0 text-xs text-blue-900">
            <Lightbulb className="mt-0.5 text-blue-600 shrink-0" strokeWidth={2} size={16} />
            <span>
              <strong>Tip:</strong> Great for learning before submitting your own idea.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

// Main Guide Component
export default function Guide() {
  const [activeSection, setActiveSection] = useState('assessment-methodology');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
        sectionRefs.current[section.id] = element;
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSectionClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = window.innerWidth < 1024 ? 80 : 24; // Account for mobile sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Circular Economy Assessment Guide
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Comprehensive guide to understanding our evaluation methodology and criteria
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-12 py-8 lg:py-12">
          <Navigation
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            className="sticky"
          />

          <main className="flex-1 min-w-0 space-y-20 pb-20">
            <AssessmentMethodologySection />
            <BusinessProblemSection />
            <BusinessSolutionSection />
            <EvaluationCriteriaSection />
            <EvaluationParametersSection />
            <ParameterDetailsSection />
            <SampleTestCasesSection />
          </main>
        </div>
      </div>
    </div>
  );
}

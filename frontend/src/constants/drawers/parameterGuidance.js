export const parameterGuidance = {
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
      {
        score: 70,
        label: 'Good Infrastructure',
        description: 'Adequate systems with some gaps',
      },
      {
        score: 50,
        label: 'Moderate Infrastructure',
        description: 'Partial systems, significant gaps',
      },
      {
        score: 30,
        label: 'Limited Infrastructure',
        description: 'Basic systems, major gaps',
      },
      {
        score: 15,
        label: 'No Infrastructure',
        description: 'No existing systems, must build everything',
      },
    ],
    examples: [
      {
        score: 80,
        case: 'Existing municipal recycling network',
        reason: 'Well-established collection points',
      },
      {
        score: 60,
        case: 'Regional composting facilities',
        reason: 'Some infrastructure exists',
      },
      {
        score: 40,
        case: 'New collection network required',
        reason: 'Significant infrastructure gaps',
      },
      {
        score: 20,
        case: 'Remote rural areas',
        reason: 'No existing infrastructure',
      },
    ],
  },
  market_price: {
    name: 'Market Price',
    category: 'Embedded Value (Economic & Technical)',
    weight: 0.2,
    weightPercent: '20%',
    definition:
      'Economic value of recovered materials, revenue potential, and market demand strength.',
    methodology:
      'Analyzes market prices for recovered materials, revenue potential, and demand stability.',
    calibration:
      'Consider: What are recovered materials worth? Is there consistent demand? Price stability?',
    scale: [
      {
        score: 85,
        label: 'High Market Value',
        description: 'Premium prices, strong demand',
      },
      {
        score: 70,
        label: 'Good Market Value',
        description: 'Competitive prices, stable demand',
      },
      {
        score: 50,
        label: 'Moderate Market Value',
        description: 'Average prices, fluctuating demand',
      },
      {
        score: 30,
        label: 'Low Market Value',
        description: 'Below average prices, weak demand',
      },
      {
        score: 15,
        label: 'No Market Value',
        description: 'No economic value, disposal cost',
      },
    ],
    examples: [
      {
        score: 85,
        case: 'Recovered aluminum with premium pricing',
        reason: 'High demand, established market',
      },
      {
        score: 60,
        case: 'Recycled plastics with moderate pricing',
        reason: 'Commodity market, price fluctuations',
      },
      {
        score: 40,
        case: 'Organic waste with low revenue',
        reason: 'Limited market applications',
      },
      {
        score: 20,
        case: 'Mixed waste requiring sorting',
        reason: 'High processing costs, low value',
      },
    ],
  },
  maintenance: {
    name: 'Maintenance',
    category: 'Embedded Value (Economic & Technical)',
    weight: 0.15,
    weightPercent: '15%',
    definition: 'Ease of upkeep, cost of maintenance, and system durability.',
    methodology:
      'Evaluates maintenance requirements, downtime frequency, and long-term durability.',
    calibration:
      'Consider: How often does it need maintenance? What skills are required? Component lifespan?',
    scale: [
      {
        score: 85,
        label: 'Low Maintenance',
        description: 'Minimal upkeep, long-lasting',
      },
      {
        score: 70,
        label: 'Moderate Maintenance',
        description: 'Regular upkeep, manageable',
      },
      {
        score: 50,
        label: 'High Maintenance',
        description: 'Frequent upkeep required',
      },
      {
        score: 30,
        label: 'Very High Maintenance',
        description: 'Constant attention needed',
      },
      {
        score: 15,
        label: 'Extreme Maintenance',
        description: 'Continuous maintenance required',
      },
    ],
    examples: [
      {
        score: 80,
        case: 'Passive solar collection systems',
        reason: 'No moving parts, long lifespan',
      },
      {
        score: 60,
        case: 'Mechanical sorting equipment',
        reason: 'Regular maintenance needed',
      },
      {
        score: 40,
        case: 'Biological processing systems',
        reason: 'Frequent monitoring required',
      },
      {
        score: 25,
        case: 'Chemical processing plants',
        reason: 'Specialized maintenance, downtime',
      },
    ],
  },
  uniqueness: {
    name: 'Uniqueness',
    category: 'Embedded Value (Economic & Technical)',
    weight: 0.15,
    weightPercent: '15%',
    definition: 'Rarity of materials, competitive advantage, and innovation level.',
    methodology:
      'Assesses material uniqueness, technological innovation, and competitive differentiation.',
    calibration:
      'Consider: How unique are the materials? What is the innovation level? Competitive advantage?',
    scale: [
      {
        score: 85,
        label: 'Highly Unique',
        description: 'Breakthrough innovation, rare materials',
      },
      {
        score: 70,
        label: 'Moderately Unique',
        description: 'Significant innovation, distinctive',
      },
      {
        score: 50,
        label: 'Somewhat Unique',
        description: 'Some innovation, incremental improvement',
      },
      {
        score: 30,
        label: 'Common Approach',
        description: 'Standard methods, widely used',
      },
      {
        score: 15,
        label: 'Commodity Solution',
        description: 'No differentiation, common solution',
      },
    ],
    examples: [
      {
        score: 85,
        case: 'Novel material recovery process',
        reason: 'Patented technology, unique approach',
      },
      {
        score: 65,
        case: 'Hybrid circular business model',
        reason: 'Innovative combination of approaches',
      },
      {
        score: 45,
        case: 'Improved recycling technology',
        reason: 'Better efficiency, similar approach',
      },
      {
        score: 25,
        case: 'Standard recycling service',
        reason: 'Common business model, no differentiation',
      },
    ],
  },
  size_efficiency: {
    name: 'Size Efficiency',
    category: 'Processing Value (Environmental & Technical)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Physical footprint, storage requirements, and transportation efficiency.',
    methodology: 'Measures space utilization, storage efficiency, and transportation optimization.',
    calibration:
      'Consider: How much space is needed? Storage efficiency? Transportation optimization?',
    scale: [
      {
        score: 85,
        label: 'Highly Efficient',
        description: 'Minimal space, excellent logistics',
      },
      {
        score: 70,
        label: 'Efficient',
        description: 'Good space utilization, optimized transport',
      },
      {
        score: 50,
        label: 'Moderately Efficient',
        description: 'Average space use, standard logistics',
      },
      {
        score: 30,
        label: 'Inefficient',
        description: 'Poor space utilization, bulky logistics',
      },
      {
        score: 15,
        label: 'Very Inefficient',
        description: 'Excessive space, poor logistics',
      },
    ],
    examples: [
      {
        score: 80,
        case: 'Compact modular processing units',
        reason: 'Small footprint, scalable design',
      },
      {
        score: 60,
        case: 'Standard processing facility',
        reason: 'Average space requirements',
      },
      {
        score: 40,
        case: 'Large centralized plant',
        reason: 'Significant space, transport costs',
      },
      {
        score: 20,
        case: 'Multiple processing sites',
        reason: 'Fragmented operations, inefficiency',
      },
    ],
  },
  chemical_safety: {
    name: 'Chemical Safety',
    category: 'Processing Value (Environmental & Technical)',
    weight: 0.1,
    weightPercent: '10%',
    definition: 'Environmental hazards and health risks (scored as inverse: higher = safer).',
    methodology:
      'Evaluates chemical safety, environmental impact, and health risks of materials and processes.',
    calibration:
      'Consider: What chemicals are involved? Environmental impact? Health and safety risks?',
    scale: [
      {
        score: 85,
        label: 'Very Safe',
        description: 'No hazardous materials, minimal impact',
      },
      {
        score: 70,
        label: 'Safe',
        description: 'Low risk materials, manageable impact',
      },
      {
        score: 50,
        label: 'Moderately Safe',
        description: 'Some risks, controlled processes',
      },
      {
        score: 30,
        label: 'Risky',
        description: 'Hazardous materials, significant impact',
      },
      {
        score: 15,
        label: 'Very Risky',
        description: 'Highly hazardous, major impact',
      },
    ],
    examples: [
      {
        score: 85,
        case: 'Water-based material separation',
        reason: 'No hazardous chemicals, safe process',
      },
      {
        score: 60,
        case: 'Mechanical recycling with additives',
        reason: 'Some chemicals, controlled use',
      },
      {
        score: 40,
        case: 'Chemical solvent recovery',
        reason: 'Hazardous solvents, safety protocols',
      },
      {
        score: 20,
        case: 'Acid digestion processes',
        reason: 'Highly hazardous, extreme risks',
      },
    ],
  },
  tech_readiness: {
    name: 'Tech Readiness',
    category: 'Processing Value (Environmental & Technical)',
    weight: 0.1,
    weightPercent: '10%',
    definition:
      'Technology maturity level and implementation complexity (scored as inverse: higher = ready).',
    methodology:
      'Assesses technology maturity, implementation complexity, and operational readiness.',
    calibration:
      'Consider: How mature is the technology? Implementation complexity? Operational readiness?',
    scale: [
      {
        score: 85,
        label: 'Mature Technology',
        description: 'Proven technology, ready to deploy',
      },
      {
        score: 70,
        label: 'Advanced Technology',
        description: 'Well-developed, some optimization needed',
      },
      {
        score: 50,
        label: 'Developing Technology',
        description: 'Functional but needs refinement',
      },
      {
        score: 30,
        label: 'Experimental Technology',
        description: 'Early stage, significant development needed',
      },
      {
        score: 15,
        label: 'Research Phase',
        description: 'Conceptual, requires extensive R&D',
      },
    ],
    examples: [
      {
        score: 85,
        case: 'Established recycling technology',
        reason: 'Proven process, widely implemented',
      },
      {
        score: 65,
        case: 'Advanced sorting systems',
        reason: 'Modern technology, some optimization',
      },
      {
        score: 45,
        case: 'Novel material recovery',
        reason: 'Promising technology, development needed',
      },
      {
        score: 20,
        case: 'Experimental chemical process',
        reason: 'Early research, unproven technology',
      },
    ],
  },
};

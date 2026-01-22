export const FACTOR_METADATA = {
  public_participation: {
    id: 'public_participation',
    title: 'Public Participation',
    category: 'Access Value',
    definition: 'Measures how easily various stakeholders can engage with your circular system.',
    methodology: 'Based on barrier analysis: technical knowledge required, geographic access, cost of participation, time commitment.',
    weight: 0.15,
    scaleGuide: {
      low: { range: '0-30', label: 'Expert-only access', description: 'Limited to specialized professionals or organizations' },
      medium: { range: '40-60', label: 'Community involvement', description: 'Requires moderate effort or specific conditions to participate' },
      high: { range: '70-100', label: 'Universal participation', description: 'Easy for general public to engage with minimal barriers' }
    },
    examples: [
      { score: 90, case: 'Municipal composting with free bins', reason: 'Zero barriers to entry' },
      { score: 50, case: 'Product take-back requiring shipping', reason: 'Moderate effort required' },
      { score: 20, case: 'Industrial recycling partnerships', reason: 'Limited to B2B relationships' }
    ],
    calibration: 'Consider: Who can participate? What do they need to do? What prevents participation?'
  },
  
  infrastructure: {
    id: 'infrastructure',
    title: 'Infrastructure & Accessibility',
    category: 'Access Value',
    definition: 'Evaluates the availability of existing infrastructure and geographic reach of your solution.',
    methodology: 'Assessment of physical infrastructure requirements, distribution networks, logistical complexity, and accessibility barriers.',
    weight: 0.15,
    scaleGuide: {
      low: { range: '0-30', label: 'Requires new infrastructure', description: 'Needs significant capital investment in facilities or networks' },
      medium: { range: '40-60', label: 'Partial infrastructure exists', description: 'Can leverage some existing systems with modifications' },
      high: { range: '70-100', label: 'Fully accessible infrastructure', description: 'Uses existing widespread infrastructure' }
    },
    examples: [
      { score: 85, case: 'Curbside collection program', reason: 'Leverages existing waste pickup infrastructure' },
      { score: 55, case: 'Drop-off recycling centers', reason: 'Requires some new collection points' },
      { score: 25, case: 'Specialized processing facility', reason: 'Needs entirely new infrastructure' }
    ],
    calibration: 'Consider: What infrastructure is needed? Does it already exist? How easy is access for users?'
  },
  
  market_price: {
    id: 'market_price',
    title: 'Market Price',
    category: 'Embedded Value',
    definition: 'Assesses the economic value of recovered materials and revenue generation potential.',
    methodology: 'Analysis of material commodity prices, market demand, revenue potential, and economic viability of recovery.',
    weight: 0.20,
    scaleGuide: {
      low: { range: '0-30', label: 'Low/no market value', description: 'Materials have minimal resale value or negative value' },
      medium: { range: '40-60', label: 'Moderate market value', description: 'Materials have established but modest market prices' },
      high: { range: '70-100', label: 'High market value', description: 'Materials command premium prices or strong demand' }
    },
    examples: [
      { score: 85, case: 'Precious metal recovery from e-waste', reason: 'High commodity value' },
      { score: 50, case: 'Recycled cardboard', reason: 'Stable but modest market prices' },
      { score: 20, case: 'Mixed low-grade plastics', reason: 'Minimal resale value' }
    ],
    calibration: 'Consider: What is the market price for recovered materials? Is there demand? Can this generate revenue?'
  },
  
  maintenance: {
    id: 'maintenance',
    title: 'Maintenance',
    category: 'Embedded Value',
    definition: 'Evaluates ease of upkeep, cost of maintenance, and durability of the circular system.',
    methodology: 'Assessment of ongoing maintenance requirements, cost of operation, durability, and system longevity.',
    weight: 0.10,
    scaleGuide: {
      low: { range: '0-30', label: 'High maintenance', description: 'Requires frequent, costly, or complex upkeep' },
      medium: { range: '40-60', label: 'Moderate maintenance', description: 'Periodic maintenance with reasonable costs' },
      high: { range: '70-100', label: 'Low maintenance', description: 'Minimal upkeep required, highly durable' }
    },
    examples: [
      { score: 80, case: 'Durable product design for disassembly', reason: 'Built to last with easy repairs' },
      { score: 50, case: 'Composting facility with regular equipment servicing', reason: 'Requires ongoing operational maintenance' },
      { score: 25, case: 'Complex chemical recycling process', reason: 'Needs specialized, frequent maintenance' }
    ],
    calibration: 'Consider: How often does the system need maintenance? What are the costs? How durable is it?'
  },
  
  uniqueness: {
    id: 'uniqueness',
    title: 'Uniqueness',
    category: 'Embedded Value',
    definition: 'Assesses the rarity of materials, competitive advantage, and innovation level of the solution.',
    methodology: 'Evaluation of material scarcity, competitive differentiation, intellectual property, and market novelty.',
    weight: 0.10,
    scaleGuide: {
      low: { range: '0-30', label: 'Common approach', description: 'Similar solutions widely available' },
      medium: { range: '40-60', label: 'Differentiated', description: 'Has some unique elements or improvements' },
      high: { range: '70-100', label: 'Highly unique', description: 'Rare materials or novel approach with competitive advantage' }
    },
    examples: [
      { score: 90, case: 'Patented process for rare earth element recovery', reason: 'Novel technology for scarce materials' },
      { score: 50, case: 'Improved textile recycling method', reason: 'Enhancement to existing processes' },
      { score: 20, case: 'Standard bottle deposit program', reason: 'Well-established approach' }
    ],
    calibration: 'Consider: How unique is this solution? Are materials rare? Does it have competitive advantages?'
  },
  
  size_efficiency: {
    id: 'size_efficiency',
    title: 'Size Efficiency',
    category: 'Processing Value',
    definition: 'Evaluates physical footprint, storage requirements, and transportation efficiency.',
    methodology: 'Assessment of space requirements, storage density, transportation costs, and scalability per unit area.',
    weight: 0.10,
    scaleGuide: {
      low: { range: '0-30', label: 'Large footprint', description: 'Requires significant space, storage, or transport resources' },
      medium: { range: '40-60', label: 'Moderate space needs', description: 'Reasonable space requirements with some optimization' },
      high: { range: '70-100', label: 'Highly efficient', description: 'Compact, easy to store and transport' }
    },
    examples: [
      { score: 85, case: 'Electronics component recovery', reason: 'Small, high-value items' },
      { score: 50, case: 'Tire recycling', reason: 'Bulky but manageable' },
      { score: 20, case: 'Construction waste processing', reason: 'Large volumes, difficult transport' }
    ],
    calibration: 'Consider: How much space is needed? How easy is transport? Can it be compacted or densified?'
  },
  
  chemical_safety: {
    id: 'chemical_safety',
    title: 'Chemical Safety',
    category: 'Processing Value',
    definition: 'Assesses environmental hazards, health risks, and safety of disposal methods (inverse scale).',
    methodology: 'Evaluation of toxicity, environmental impact, health hazards, regulatory compliance, and safe handling requirements.',
    weight: 0.10,
    scaleGuide: {
      low: { range: '0-30', label: 'High hazards', description: 'Toxic materials, significant environmental or health risks' },
      medium: { range: '40-60', label: 'Moderate hazards', description: 'Some safety concerns, manageable with precautions' },
      high: { range: '70-100', label: 'Safe materials', description: 'Non-toxic, minimal environmental or health risks' }
    },
    examples: [
      { score: 90, case: 'Organic waste composting', reason: 'Natural, non-toxic materials' },
      { score: 50, case: 'Glass recycling', reason: 'Inert but requires safe handling of sharp materials' },
      { score: 20, case: 'Battery chemical recovery', reason: 'Hazardous materials requiring strict safety protocols' }
    ],
    calibration: 'Consider: Are materials toxic? What are environmental risks? How safe is handling and processing?'
  },
  
  tech_readiness: {
    id: 'tech_readiness',
    title: 'Tech Readiness',
    category: 'Processing Value',
    definition: 'Evaluates technology maturity, implementation complexity (inverse), and availability of required technology.',
    methodology: 'Assessment based on Technology Readiness Level (TRL), complexity of implementation, availability of equipment, and technical expertise requirements.',
    weight: 0.10,
    scaleGuide: {
      low: { range: '0-30', label: 'Experimental/complex', description: 'Requires R&D or highly specialized technology' },
      medium: { range: '40-60', label: 'Proven but specialized', description: 'Technology exists but needs adaptation or expertise' },
      high: { range: '70-100', label: 'Mature/ready', description: 'Widely available, proven technology, easy to implement' }
    },
    examples: [
      { score: 85, case: 'Mechanical sorting of materials', reason: 'Mature, widely available technology' },
      { score: 50, case: 'Enzymatic plastic degradation', reason: 'Proven in labs, limited commercial deployment' },
      { score: 20, case: 'Novel molecular transformation process', reason: 'Early-stage research' }
    ],
    calibration: 'Consider: How mature is the technology? How complex is implementation? Is expertise readily available?'
  }
};

export const MARKET_AVERAGES = {
  public_participation: 55,
  infrastructure: 50,
  market_price: 45,
  maintenance: 60,
  uniqueness: 40,
  size_efficiency: 55,
  chemical_safety: 65,
  tech_readiness: 50
};

export const CATEGORY_GROUPS = {
  'Access Value': ['public_participation', 'infrastructure'],
  'Embedded Value': ['market_price', 'maintenance', 'uniqueness'],
  'Processing Value': ['size_efficiency', 'chemical_safety', 'tech_readiness']
};

export const MODAL_CONTENT = {
  problemGuide: {
    title: 'How to Describe Your Business Problem',
    sections: [
      {
        heading: 'Be Specific and Quantitative',
        content: 'Clearly define the environmental or circular economy challenge. Include scale, impact, and current state.',
        examples: [
          'Good: "Single-use plastic packaging creates 8M tons of ocean waste annually, with only 9% being recycled globally."',
          'Poor: "Plastic is bad for the environment."'
        ]
      },
      {
        heading: 'Identify Stakeholders',
        content: 'Who is affected? Who creates the problem? Who could solve it?',
        examples: [
          'Good: "Fast fashion generates 92M tons of textile waste yearly, with consumers discarding items after 7-10 wears on average."',
          'Poor: "People throw away too many clothes."'
        ]
      },
      {
        heading: 'Show System Failure',
        content: 'Why does the current system fail? What linear economy aspects create waste?',
        examples: [
          'Good: "Electronic device manufacturers use irreplaceable batteries and proprietary parts, forcing device disposal after 2-3 years."',
          'Poor: "Electronics break too easily."'
        ]
      }
    ],
    minLength: 200,
    tip: 'Think like a sustainability researcher: data, scale, root causes.'
  },
  
  solutionGuide: {
    title: 'How to Describe Your Business Solution',
    sections: [
      {
        heading: 'Materials and Processes',
        content: 'What materials do you work with? What processes transform them? Be technically specific.',
        examples: [
          'Good: "Compostable packaging from agricultural hemp waste using compression molding, achieving 90-day biodegradation."',
          'Poor: "We make eco-friendly packaging."'
        ]
      },
      {
        heading: 'Circularity Strategy',
        content: 'How do you close the loop? Specify: repair, reuse, refurbish, remanufacture, recycle, or regenerate.',
        examples: [
          'Good: "Hub-and-spoke collection model with local composting facilities returns nutrients to partner farms within 50km radius."',
          'Poor: "We recycle stuff."'
        ]
      },
      {
        heading: 'Business Model',
        content: 'How does value flow? Who pays? How is this economically viable?',
        examples: [
          'Good: "Subscription service where restaurants pay per-use for reusable containers, offset by deposit system and material recovery revenue."',
          'Poor: "Customers will pay for our service."'
        ]
      }
    ],
    minLength: 200,
    tip: 'Think like an engineer: materials, processes, flows, and business mechanics.'
  }
};

export const CONFIDENCE_LEVELS = {
  high: { min: 70, label: 'High Confidence', color: '#34a83a' },
  medium: { min: 40, label: 'Medium Confidence', color: '#ff9800' },
  low: { min: 0, label: 'Low Confidence', color: '#dc3545' }
};

export const SIMILARITY_LEVELS = {
  high: { min: 0.7, label: 'High Match', color: '#34a83a' },
  medium: { min: 0.4, label: 'Moderate Match', color: '#ff9800' },
  low: { min: 0, label: 'Low Match', color: '#999' }
};

export const SEVERITY_CONFIG = {
  high: { icon: '⚠️', color: '#dc3545', label: 'High Severity' },
  medium: { icon: '⚡', color: '#ff9800', label: 'Medium Severity' },
  low: { icon: 'ℹ️', color: '#4a90e2', label: 'Low Severity' }
};

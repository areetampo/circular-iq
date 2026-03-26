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
  // ... (truncated for brevity - this would include all other parameters)
};

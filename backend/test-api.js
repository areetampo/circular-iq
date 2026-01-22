import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/score';

const testCases = [
  {
    name: 'Valid Request',
    payload: {
      businessProblem: 'Single-use plastic packaging creates approximately 8 million tons of ocean waste annually, harming marine ecosystems and entering the food chain. Current recycling infrastructure only processes 9% of plastic waste, leaving the majority in landfills or the environment. The packaging industry lacks economically viable alternatives that maintain product freshness while being truly biodegradable.',
      businessSolution: 'We produce compostable food packaging from agricultural hemp waste using a hub-and-spoke collection model. Our packaging decomposes within 90 days in commercial composting facilities, returning nutrients to soil. We partner with organic farms to source hemp byproducts, creating a closed-loop system where packaging becomes soil amendment for future crops. Our material maintains barrier properties equivalent to conventional plastics while costing 15% less due to waste stream sourcing.',
      parameters: {
        public_participation: 75,
        infrastructure: 60,
        market_price: 70,
        maintenance: 80,
        uniqueness: 85,
        size_efficiency: 65,
        chemical_safety: 90,
        tech_readiness: 70
      }
    },
    expectedStatus: 200
  },
  {
    name: 'Short Business Problem',
    payload: {
      businessProblem: 'Plastic waste is bad.',
      businessSolution: 'We produce compostable food packaging from agricultural hemp waste using a hub-and-spoke collection model. Our packaging decomposes within 90 days in commercial composting facilities, returning nutrients to soil. We partner with organic farms to source hemp byproducts, creating a closed-loop system.',
      parameters: {
        public_participation: 75,
        infrastructure: 60,
        market_price: 70,
        maintenance: 80,
        uniqueness: 85,
        size_efficiency: 65,
        chemical_safety: 90,
        tech_readiness: 70
      }
    },
    expectedStatus: 400
  },
  {
    name: 'Short Business Solution',
    payload: {
      businessProblem: 'Single-use plastic packaging creates approximately 8 million tons of ocean waste annually, harming marine ecosystems and entering the food chain. Current recycling infrastructure only processes 9% of plastic waste, leaving the majority in landfills or the environment. The packaging industry lacks economically viable alternatives that maintain product freshness while being truly biodegradable.',
      businessSolution: 'We make compostable packaging.',
      parameters: {
        public_participation: 75,
        infrastructure: 60,
        market_price: 70,
        maintenance: 80,
        uniqueness: 85,
        size_efficiency: 65,
        chemical_safety: 90,
        tech_readiness: 70
      }
    },
    expectedStatus: 400
  },
  {
    name: 'Missing Parameters',
    payload: {
      businessProblem: 'Single-use plastic packaging creates approximately 8 million tons of ocean waste annually, harming marine ecosystems and entering the food chain. Current recycling infrastructure only processes 9% of plastic waste, leaving the majority in landfills or the environment. The packaging industry lacks economically viable alternatives that maintain product freshness while being truly biodegradable.',
      businessSolution: 'We produce compostable food packaging from agricultural hemp waste using a hub-and-spoke collection model. Our packaging decomposes within 90 days in commercial composting facilities, returning nutrients to soil. We partner with organic farms to source hemp byproducts, creating a closed-loop system where packaging becomes soil amendment for future crops.'
    },
    expectedStatus: 400
  }
];

async function runTests() {
  console.log('🧪 Testing API Server Updates...\n');

  for (const test of testCases) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });

      const data = await response.json();
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Status ${response.status}`);
        
        if (response.status === 200) {
          console.log('   Checking response structure...');
          const checks = [
            { name: 'overall_score exists', pass: typeof data.overall_score === 'number' },
            { name: 'sub_scores exists', pass: data.sub_scores && typeof data.sub_scores === 'object' },
            { name: 'audit exists', pass: data.audit && typeof data.audit === 'object' },
            { name: 'similar_cases exists', pass: Array.isArray(data.similar_cases) },
            { name: 'audit.confidence_score exists', pass: typeof data.audit?.confidence_score === 'number' },
            { name: 'audit.integrity_gaps exists', pass: Array.isArray(data.audit?.integrity_gaps) },
            { name: 'audit.strengths exists', pass: Array.isArray(data.audit?.strengths) },
            { name: 'audit.key_metrics_comparison exists', pass: data.audit?.key_metrics_comparison && typeof data.audit.key_metrics_comparison === 'object' },
            { name: 'similar_cases have metadata', pass: data.similar_cases.every(c => c.metadata !== undefined) }
          ];
          
          checks.forEach(check => {
            console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
          });
        } else {
          console.log(`   Error message: ${data.error}`);
        }
      } else {
        console.log(`❌ FAIL - Expected ${test.expectedStatus}, got ${response.status}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
      }
      
      console.log('');
    } catch (err) {
      console.log(`❌ ERROR - ${err.message}`);
      console.log('   (Make sure the server is running on port 3001)\n');
    }
  }
}

runTests();

import '#config/loadEnv.js';
import assert from 'node:assert';
import { after, before, test } from 'node:test';

import request from 'supertest';

import { BACKEND_CONFIG } from '#config/backend.config.js';
import { closeAllPools } from '#database/index.js';

let app;

// Get API key from environment for test authentication
const TEST_API_KEY = process.env.API_KEY || 'test-api-key';
const AUTH_ENABLED = BACKEND_CONFIG.app.apiAuthEnabled;

before(async () => {
  const mod = await import('#server/index.js');
  app = mod.default || mod.app || mod;
});

after(async () => {
  // Close all database pools and connections to prevent hanging
  await closeAllPools();
});

// POST /score input validation tests
test('POST /score rejects missing businessProblem', async () => {
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: 50,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert.strictEqual(res.status, 400, 'Should reject missing businessProblem');
  assert(res.body.error, 'Should include error message');
});

test('POST /score rejects businessProblem shorter than 200 chars', async () => {
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: 'Short problem',
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: 50,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert.strictEqual(res.status, 400, 'Should reject problem < 200 chars');
});

test('POST /score rejects businessSolution shorter than 200 chars', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: 'Short solution',
    evaluationParameters: {
      public_participation: 50,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert.strictEqual(res.status, 400, 'Should reject solution < 200 chars');
});

test('POST /score rejects missing parameters object', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: validSolution,
  });

  assert.strictEqual(res.status, 400, 'Should reject missing parameters');
});

test('POST /score rejects parameter value outside 0-100 range', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: 150,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert.strictEqual(res.status, 400, 'Should reject parameter > 100');
});

test('POST /score rejects negative parameter value', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: -10,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert.strictEqual(res.status, 400, 'Should reject negative parameter');
});

test('POST /score rejects non-numeric parameter', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: 'fifty',
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert.strictEqual(res.status, 400, 'Should reject non-numeric parameter');
});

test('POST /score requires all 8 parameters', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: 50,
      infrastructure: 50,
      market_price: 50,
      maintenance: 50,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      // missing tech_readiness
    },
  });

  assert.strictEqual(res.status, 400, 'Should require all 8 parameters');
});

test('POST /score accepts valid input with all 8 parameters', async () => {
  const validProblem =
    'Our company is struggling with plastic waste management in our manufacturing process. We generate tons of plastic waste monthly that ends up in landfills. This is not only environmentally harmful but also costly in terms of waste disposal fees and lost material value. We need a comprehensive solution that can help us reduce, reuse, or recycle this plastic waste more effectively.';
  const validSolution =
    'Implement a closed-loop plastic recycling system that transforms manufacturing waste into raw materials for new products. This includes installing advanced sorting technology, partnering with local recycling facilities, and redesigning packaging to use recycled content. The system would track waste streams and create value from what was previously considered waste.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: validProblem,
    businessSolution: validSolution,
    evaluationParameters: {
      public_participation: 50,
      infrastructure: 60,
      market_price: 70,
      maintenance: 55,
      uniqueness: 65,
      size_efficiency: 60,
      chemical_safety: 80,
      tech_readiness: 70,
    },
  });

  // May return 200 if processing succeeds, or 500 if OpenAI/DB fails
  assert(res.status === 200 || res.status === 500, 'Valid input should be accepted');

  // When successful, response MUST include original inputs so callers
  // can persist a complete snapshot. If endpoint returned 500 we skip
  // assertions to avoid flaky failures when external services are down.
  if (res.status === 200) {
    assert.strictEqual(res.body.businessProblem, validProblem);
    assert.strictEqual(res.body.businessSolution, validSolution);
    assert(res.body.evaluation_parameters && typeof res.body.evaluation_parameters === 'object');
  }
});

test('POST /score accepts boundary values (0 and 100)', async () => {
  const boundaryProblem =
    'Our agricultural business faces significant challenges with water scarcity and soil degradation. Current farming practices are unsustainable, leading to reduced crop yields and increased costs for irrigation and fertilizers. We need innovative approaches to restore soil health and optimize water usage while maintaining productivity.';
  const boundarySolution =
    'Implement regenerative agriculture practices including drip irrigation systems, cover cropping, and composting. These methods will improve water retention, enhance soil organic matter, and reduce dependence on chemical inputs. The approach focuses on long-term sustainability and resilience.';

  const requestBuilder = request(app).post('/api/score');

  if (AUTH_ENABLED) {
    requestBuilder.set('Authorization', `Bearer ${TEST_API_KEY}`);
  }

  const res = await requestBuilder.send({
    businessProblem: boundaryProblem,
    businessSolution: boundarySolution,
    evaluationParameters: {
      public_participation: 0,
      infrastructure: 100,
      market_price: 0,
      maintenance: 100,
      uniqueness: 50,
      size_efficiency: 50,
      chemical_safety: 50,
      tech_readiness: 50,
    },
  });

  assert(res.status === 200 || res.status === 500, 'Should accept 0 and 100');
});

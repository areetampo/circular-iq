import '#server/bootstrap.js';
import { BACKEND_CONFIG } from '#config/backend.config.js';
import { validateInput } from '#services/scoring.service.js';

// Ensure API key is available for validation
if (!BACKEND_CONFIG.openai.apiKey) {
  console.warn('⚠️  OPENAI_API_KEY not configured, running validation logic offline');
}

const cases = [
  { name: 'empty', p: '', s: '' },
  { name: 'short', p: 'short', s: 'also short' },
  { name: 'junk pattern', p: 'xxxxx', s: '-----' },
  {
    name: 'valid-ish',
    p: 'This is a reasonably long problem description with real words and context. It should pass the junk filter.',
    s: 'This is a reasonably long solution description describing processes and materials.',
  },
];

for (const c of cases) {
  const res = validateInput(c.p, c.s);
  console.log(`${c.name}:`, res ? { junk: true, reason: res.reason } : { junk: false });
}

// Exit with non-zero if the realistic case flagged as junk
const validRes = validateInput(cases[3].p, cases[3].s);
if (validRes) {
  console.error('❌ validateInput flagged the valid case as junk:', validRes);
  process.exit(2);
}

console.log('✅ validateInput checks passed');
process.exit(0);

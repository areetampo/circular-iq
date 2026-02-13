#!/usr/bin/env node
// Ensure OpenAI client does not throw on import (we only need validateInput which is pure)
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'DUMMY_KEY_FOR_TESTS';
const { validateInput } = await import('../src/ask.js');

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

// Exit with non-zero if any valid-ish case flagged as junk
const validRes = validateInput(cases[3].p, cases[3].s);
if (validRes) process.exit(2);
process.exit(0);

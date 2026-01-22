import fs from 'fs';
import path from 'path';

const chunksPath = path.join('dataset', 'chunks.json');
const chunks = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

console.log(`Total chunks: ${chunks.length}`);
if (chunks.length > 0) {
  console.log('\nSample chunk:');
  console.log(JSON.stringify(chunks[0], null, 2).substring(0, 600));
  console.log('...\n');
  console.log(`\n✓ chunks.json is valid and contains ${chunks.length} chunks`);
}

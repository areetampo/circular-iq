import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

function extractMetadata(problem, solution) {
  const metadata = {
    category: 'general',
    materials: [],
    strategies: []
  };

  const problemLower = problem.toLowerCase();
  const solutionLower = solution.toLowerCase();
  const combinedText = problemLower + ' ' + solutionLower;

  if (combinedText.includes('plastic') || combinedText.includes('packaging')) {
    metadata.category = 'plastic-waste';
  } else if (combinedText.includes('fashion') || combinedText.includes('clothing') || combinedText.includes('textile')) {
    metadata.category = 'fashion-textiles';
  } else if (combinedText.includes('construction') || combinedText.includes('building')) {
    metadata.category = 'construction';
  } else if (combinedText.includes('electronic') || combinedText.includes('e-waste') || combinedText.includes('device')) {
    metadata.category = 'electronics';
  } else if (combinedText.includes('food') || combinedText.includes('organic')) {
    metadata.category = 'food-organic';
  } else if (combinedText.includes('energy') || combinedText.includes('power')) {
    metadata.category = 'energy';
  }

  const materialKeywords = ['plastic', 'paper', 'metal', 'glass', 'textile', 'organic', 'electronic', 'wood', 'composite'];
  materialKeywords.forEach(material => {
    if (combinedText.includes(material)) {
      metadata.materials.push(material);
    }
  });

  const strategyKeywords = ['recycle', 'reuse', 'reduce', 'repair', 'refurbish', 'upcycle', 'modular', 'sharing', 'rental', 'subscription'];
  strategyKeywords.forEach(strategy => {
    if (combinedText.includes(strategy)) {
      metadata.strategies.push(strategy);
    }
  });

  return metadata;
}

function processCSVChunks() {
  console.log('Starting CSV chunking process...\n');

  const csvPath = path.join('dataset', 'GreenTechGuardians', 'AI_EarthHack_Dataset.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Reading CSV from: ${csvPath}`);
  const fileContent = fs.readFileSync(csvPath, 'utf8');

  console.log('Parsing CSV records...');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`Found ${records.length} records in CSV\n`);

  const chunks = [];
  let processedCount = 0;
  const totalRecords = records.length;

  for (const record of records) {
    processedCount++;
    
    if (processedCount % 100 === 0) {
      console.log(`Processing record ${processedCount}/${totalRecords}...`);
    }

    const id = record.id || processedCount.toString();
    const problem = record.problem || '';
    const solution = record.solution || '';

    if (!problem.trim() || !solution.trim()) {
      console.warn(`Warning: Record ${id} has empty problem or solution, skipping...`);
      continue;
    }

    const fullText = `Problem: ${problem.trim()}\n\nSolution: ${solution.trim()}`;
    
    const metadata = extractMetadata(problem, solution);
    metadata.source_id = id;
    metadata.chunk_index = chunks.length;

    chunks.push({
      id: chunks.length + 1,
      source_id: id,
      problem: problem.trim(),
      solution: solution.trim(),
      full_text: fullText,
      metadata
    });
  }

  console.log(`\nSuccessfully processed ${chunks.length} chunks from ${processedCount} records`);

  const outputPath = path.join('dataset', 'chunks.json');
  fs.writeFileSync(outputPath, JSON.stringify(chunks, null, 2));
  console.log(`Chunks saved to: ${outputPath}`);

  return chunks;
}

const chunks = processCSVChunks();

console.log('\n=== CHUNKING SUMMARY ===');
console.log(`Total chunks created: ${chunks.length}`);
console.log(`Output file: dataset/chunks.json`);

if (chunks.length > 0) {
  console.log('\n=== SAMPLE CHUNK ===');
  console.log(JSON.stringify(chunks[0], null, 2));
  
  console.log('\n=== CATEGORY DISTRIBUTION ===');
  const categoryCount = {};
  chunks.forEach(chunk => {
    const cat = chunk.metadata.category;
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} chunks`);
  });
}

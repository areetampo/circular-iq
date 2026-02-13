# Adding New Datasets to Your Circular Economy Database

## A Comprehensive Guide for Future Dataset Integration

---

## 📋 Table of Contents

1. [Dataset Requirements](#dataset-requirements)
2. [Finding Quality Datasets](#finding-quality-datasets)
3. [Dataset Evaluation Checklist](#dataset-evaluation-checklist)
4. [Step-by-Step Integration Process](#step-by-step-integration-process)
5. [Dataset Format Requirements](#dataset-format-requirements)
6. [Creating Dataset Adapters](#creating-dataset-adapters)
7. [Testing New Datasets](#testing-new-datasets)
8. [Troubleshooting Common Issues](#troubleshooting-common-issues)
9. [Best Practices](#best-practices)
10. [Recommended Data Sources](#recommended-data-sources)

---

## 🎯 Dataset Requirements

### **Essential Fields**

For a dataset to work with your Circular Economy RAG system, it MUST contain at least these fields (or you must be able to derive them):

| Field                 | Required    | Description                        | Example                                                    |
| --------------------- | ----------- | ---------------------------------- | ---------------------------------------------------------- |
| **Problem**           | ✅ Yes      | The business/environmental problem | "High plastic waste in packaging industry"                 |
| **Solution**          | ✅ Yes      | The circular economy solution      | "Implement biodegradable packaging from mushroom mycelium" |
| **ID**                | ✅ Yes      | Unique identifier                  | "project_001" or auto-generated                            |
| **Category**          | Recommended | Problem category                   | "Packaging", "Textiles", "Energy"                          |
| **Materials**         | Recommended | Materials involved                 | "Plastic", "Mushroom mycelium", "Cardboard"                |
| **Circular Strategy** | Recommended | R-strategy used                    | "Reduction", "Recycling", "Regeneration"                   |
| **Impact**            | Optional    | Expected outcomes                  | "60% waste reduction, 40% cost savings"                    |

### **Minimum Data Quality Standards**

✅ **Problem field must be:**

- At least 20 characters (configurable via `MIN_PROBLEM_LENGTH` in `.env`)
- Contains meaningful description (not just keywords)
- Written in coherent sentences
- Describes a real business/environmental challenge

✅ **Solution field must be:**

- At least 20 characters (configurable via `MIN_SOLUTION_LENGTH` in `.env`)
- Describes actionable steps or approaches
- Relates directly to the problem
- Contains specific details (not generic advice)

✅ **Overall quality:**

- No all-caps text (>80% uppercase = rejected)
- No excessive repetition
- Real data, not placeholder text
- English language (or translatable)

---

## 🔍 Finding Quality Datasets

### **Top-Tier Sources (Highly Recommended)**

#### **1. Government & International Organizations**

**United Nations**

- UN Environment Programme: https://www.unep.org/resources
- UNEP Global Material Flows: https://www.resourcepanel.org/global-material-flows-database
- UN SDG Database: https://unstats.un.org/sdgs/dataportal

**European Union**

- Eurostat Circular Economy: https://ec.europa.eu/eurostat/web/circular-economy
- EU Open Data Portal: https://data.europa.eu/data/datasets
- European Environment Agency: https://www.eea.europa.eu/data-and-maps

**World Bank**

- Climate Change Data: https://climateknowledgeportal.worldbank.org/
- Open Data: https://data.worldbank.org/
- Circular Economy Toolkit: https://www.worldbank.org/en/topic/urbandevelopment/brief/solid-waste-management

**OECD**

- Environment Statistics: https://stats.oecd.org/
- Green Growth Indicators: https://www.oecd.org/environment/green-growth/
- Waste Statistics: https://stats.oecd.org/Index.aspx?DataSetCode=MUNW

#### **2. Academic & Research Institutions**

**Our World in Data** (Already using these!)

- All topics: https://github.com/owid
- CO2 & Emissions: https://github.com/owid/co2-data
- Energy: https://github.com/owid/energy-data
- Plastic pollution: https://github.com/owid/plastic-pollution

**Ellen MacArthur Foundation**

- Circular Economy Database: https://ellenmacarthurfoundation.org/resources
- Case Studies: https://ellenmacarthurfoundation.org/case-studies

**MIT Materials Research**

- Materials Database: https://materialsproject.org/
- Circular Economy Research: https://mitsloan.mit.edu/ideas-made-to-matter/circular-economy

#### **3. Industry-Specific Sources**

**Product Lifecycle**

- Open Food Facts: https://world.openfoodfacts.org/data
- Open Beauty Facts: https://world.openbeautyfacts.org/data
- Ecoinvent Database: https://ecoinvent.org/ (paid, but high quality)

**Construction & Built Environment**

- RICS Construction Data: https://www.rics.org/profession-standards/rics-data-services
- Green Building Materials: https://www.buildinggreen.com/

**Textiles & Fashion**

- Fashion Transparency Index: https://www.fashionrevolution.org/about/transparency/
- Textile Exchange: https://textileexchange.org/knowledge-center/reports/

#### **4. Platform Datasets**

**Kaggle**

- Search: "circular economy", "sustainability", "recycling", "waste management"
- URL: https://www.kaggle.com/datasets
- Filter by: CSV format, >1MB size, >10 usability score

**Google Dataset Search**

- Search: "circular economy", "lifecycle assessment", "material flows"
- URL: https://datasetsearch.research.google.com/

**Data.gov (US Government)**

- EPA Data: https://www.epa.gov/data
- Energy Data: https://www.energy.gov/data/open-energy-data

**GitHub Awesome Lists**

- Awesome Public Datasets: https://github.com/awesomedata/awesome-public-datasets
- Awesome CSV: https://github.com/secretGeek/AwesomeCSV

---

## ✅ Dataset Evaluation Checklist

Before downloading a new dataset, verify:

### **Pre-Download Checks**

- [ ] **Format:** Is it CSV, JSON, or easily convertible? (Avoid PDFs, locked Excel files)
- [ ] **Size:** Is it manageable? (<500MB recommended, <50MB ideal)
- [ ] **Update Frequency:** When was it last updated? (Prefer datasets updated within 2 years)
- [ ] **License:** Is it open data or creative commons licensed?
- [ ] **Documentation:** Does it have a README, data dictionary, or codebook?
- [ ] **Language:** Is it in English or easily translatable?

### **Post-Download Checks**

- [ ] **Column Headers:** Are column names clear and descriptive?
- [ ] **Data Completeness:** What % of rows have null values? (Aim for >80% completeness)
- [ ] **Sample Quality:** Do sample rows contain meaningful data?
- [ ] **Encoding:** Is it UTF-8 encoded? (Check for special characters)
- [ ] **Delimiter:** What's the delimiter? (Comma, semicolon, tab?)
- [ ] **Duplicates:** Are there duplicate rows?

### **Content Quality Checks**

- [ ] **Relevance:** Does it relate to circular economy, sustainability, or waste management?
- [ ] **Actionability:** Does it contain solutions or case studies (not just statistics)?
- [ ] **Geographic Coverage:** What regions does it cover?
- [ ] **Time Period:** What years does it span?
- [ ] **Problem-Solution Pairs:** Can you derive problem-solution relationships?

---

## 🔧 Step-by-Step Integration Process

### **STEP 1: Download and Inspect**

```powershell
# Navigate to raw data directory
cd "C:\Iris\major proj\circular economy\backend\dataset\raw"

# Download the dataset (example)
Invoke-WebRequest -Uri "https://example.com/new-dataset.csv" -OutFile "new_dataset.csv" -UseBasicParsing

# Check file size
Get-ChildItem new_dataset.csv | Select-Object Name, Length

# View first 10 rows
Get-Content new_dataset.csv -Head 10

# Check encoding
Get-Content new_dataset.csv -Encoding UTF8 -Head 5
```

### **STEP 2: Analyze Column Structure**

```powershell
# Import and inspect columns
$data = Import-Csv new_dataset.csv -ErrorAction Stop
$data | Get-Member -MemberType NoteProperty | Select-Object Name

# Count rows
$data.Count

# Check for nulls in key columns
$data | Where-Object { -not $_.ColumnName } | Measure-Object
```

### **STEP 3: Create a Test Sample**

Extract 100-200 rows for testing:

```powershell
# Create a sample for testing
$sample = Import-Csv new_dataset.csv | Select-Object -First 200
$sample | Export-Csv "new_dataset_sample.csv" -NoTypeInformation

# Move sample to samples directory
Move-Item new_dataset_sample.csv ..\samples\
```

### **STEP 4: Map Columns to Required Format**

Create a mapping document:

```markdown
# Column Mapping: new_dataset.csv

| Original Column       | Maps To   | Notes                    |
| --------------------- | --------- | ------------------------ |
| project_title         | ID        | Use as unique identifier |
| challenge_description | problem   | Main problem field       |
| implemented_solution  | solution  | Main solution field      |
| material_used         | materials | Material field           |
| waste_type            | category  | Map to category          |
| reduction_percentage  | impact    | Quantitative impact      |
```

### **STEP 5: Create/Update Merge Script**

Edit `merge_datasets.ps1` to include your new dataset:

```powershell
# Add this section to merge_datasets.ps1

# ===== PROCESS NEW DATASET =====
Write-Host "`nX️⃣  Processing NEW DATASET data..." -ForegroundColor Yellow
$newDataPath = Join-Path $rawDir "new_dataset.csv"

if (Test-Path $newDataPath) {
    try {
        $newData = Import-Csv $newDataPath -ErrorAction Stop |
            Select-Object -First $maxRowsPerDataset

        foreach ($row in $newData) {
            # Map original columns to required format
            $problem = $row.challenge_description
            $solution = $row.implemented_solution
            $materials = $row.material_used
            $category = $row.waste_type

            # Validate minimum quality
            if ($problem.Length -lt 20 -or $solution.Length -lt 20) {
                continue  # Skip low-quality rows
            }

            $allRecords += New-CircularRecord `
                -id "newdata_${recordId}" `
                -problem $problem `
                -solution $solution `
                -materials $materials `
                -circular_strategy "Recycling" `
                -category $category `
                -impact $row.reduction_percentage

            $recordId++
        }
        Write-Host "   ✓ Added $($newData.Count) new dataset records" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠ Warning: Could not process new dataset: $_" -ForegroundColor Yellow
    }
}
else {
    Write-Host "   ⚠ Skipping: new_dataset.csv not found" -ForegroundColor Yellow
}
```

### **STEP 6: Test Merge with Sample**

```powershell
# Run merge with sample only
cd "C:\Iris\major proj\circular economy\backend\dataset"
powershell -ExecutionPolicy Bypass -File merge_datasets.ps1

# Verify output
Get-Content combined_input.csv | Select-String "newdata_" | Measure-Object

# Inspect sample records
Import-Csv combined_input.csv | Where-Object { $_.ID -like "newdata_*" } | Select-Object -First 5 | Format-Table
```

### **STEP 7: Run Chunking Pipeline**

```powershell
cd "C:\Iris\major proj\circular economy\backend"

# Generate chunks
node scripts/chunk.js dataset/combined_input.csv dataset/chunks.json

# Check chunk output
node -e "const chunks = require('./dataset/chunks.json'); console.log('Total chunks:', chunks.length); console.log('Sample:', chunks[0])"
```

### **STEP 8: Dry Run Embedding**

```powershell
# Test embedding without API calls
node scripts/embed_and_store.js --dry-run

# Check dry run output
Get-Content dataset\stored_documents.jsonl | Select-String "newdata_" | Measure-Object
```

### **STEP 9: Generate Real Embeddings**

⚠️ **This uses OpenAI API credits!**

```powershell
# Clear old embeddings (optional)
# This will delete existing vectors in Supabase

# Generate embeddings for all data including new dataset
node scripts/embed_and_store.js

# Monitor progress
# Watch for errors or warnings
```

### **STEP 10: Validate Integration**

```powershell
# Run end-to-end pipeline test
node scripts/test_e2e_pipeline.js

# Test retrieval with new dataset
node scripts/test_score_fetch.js

# Check Supabase
node scripts/poll_supabase.js
```

### **STEP 11: Document the Dataset**

Create a record in `dataset/README.md`:

```markdown
## Dataset: New Dataset Name

**Added:** 2026-02-12
**Source:** https://example.com/new-dataset
**Rows:** 200
**License:** CC-BY-4.0

**Description:**
This dataset contains circular economy case studies from...

**Key Columns:**

- challenge_description → problem
- implemented_solution → solution
- material_used → materials

**Notes:**

- Filtered rows with less than 20 characters
- Focus on recycling and waste reduction projects
```

---

## 📄 Dataset Format Requirements

### **Option 1: Direct CSV Format (Easiest)**

If your CSV already has these exact columns, it works out-of-the-box:

```csv
ID,problem,solution,materials,circular_strategy,category,impact
row_1,"Problem description","Solution description","Materials list","Reduction","Energy","Impact details"
```

### **Option 2: Mapped CSV Format (Most Common)**

Your CSV has different column names that need mapping:

```csv
project_id,challenge,fix,material_type,strategy_type,sector,outcome
proj_001,"Challenge text","Fix text","Material","Strategy","Sector","Outcome"
```

**Mapping in merge script:**

```powershell
$problem = $row.challenge
$solution = $row.fix
$materials = $row.material_type
```

### **Option 3: Derived Fields (Advanced)**

Your CSV has data but needs transformation:

```csv
country,year,waste_tonnes,recycling_rate
USA,2023,300000000,35
```

**Transformation logic:**

```powershell
$problem = "High waste generation in $($row.country) - $($row.waste_tonnes) tonnes in $($row.year)"
$solution = "Increase recycling infrastructure to improve current $($row.recycling_rate)% rate"
$category = "Waste Management"
```

---

## 🔌 Creating Dataset Adapters

For complex datasets, create a dedicated adapter in `dataset/adapters/`:

### **Example Adapter Structure**

Create `dataset/adapters/ingest_new_dataset.js`:

```javascript
/**
 * Adapter for New Dataset
 * Converts New Dataset format to standardized circular economy format
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';

export function ingestNewDataset(inputPath, outputPath) {
  console.log('Processing New Dataset...');

  // Load CSV
  const fileContent = fs.readFileSync(inputPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
  });

  // Transform to standard format
  const transformed = records
    .map((row, index) => {
      // Validation
      if (!row.challenge_description || row.challenge_description.length < 20) {
        return null; // Skip invalid rows
      }

      // Mapping
      return {
        ID: row.project_id || `newdata_${index}`,
        problem: row.challenge_description,
        solution: row.implemented_solution,
        materials: row.material_used || '',
        circular_strategy: mapStrategy(row.strategy_type),
        category: mapCategory(row.sector),
        impact: row.reduction_percentage ? `${row.reduction_percentage}% reduction` : '',
      };
    })
    .filter(Boolean); // Remove null entries

  console.log(`✓ Transformed ${transformed.length}/${records.length} records`);

  // Write output
  const csvHeader = 'ID,problem,solution,materials,circular_strategy,category,impact\n';
  const csvRows = transformed
    .map(
      (r) =>
        `"${r.ID}","${r.problem}","${r.solution}","${r.materials}","${r.circular_strategy}","${r.category}","${r.impact}"`,
    )
    .join('\n');

  fs.writeFileSync(outputPath, csvHeader + csvRows, 'utf-8');
  console.log(`✓ Saved to ${outputPath}`);

  return transformed.length;
}

// Helper: Map strategy types
function mapStrategy(strategyType) {
  const mapping = {
    reduce: 'Reduction',
    reuse: 'Reuse',
    recycle: 'Recycling',
    recover: 'Recovery',
    regenerate: 'Regeneration',
  };
  return mapping[strategyType?.toLowerCase()] || 'Reduction';
}

// Helper: Map categories
function mapCategory(sector) {
  const mapping = {
    manufacturing: 'Manufacturing',
    agriculture: 'Agriculture',
    packaging: 'Packaging',
    textiles: 'Textiles',
    construction: 'Construction',
  };
  return mapping[sector?.toLowerCase()] || 'General';
}

// Main execution
if (process.argv[1].endsWith('ingest_new_dataset.js')) {
  const inputPath = process.argv[2] || './raw/new_dataset.csv';
  const outputPath = process.argv[3] || './processed/new_dataset_processed.csv';

  ingestNewDataset(inputPath, outputPath);
}
```

### **Using the Adapter**

```powershell
# Run the adapter
cd "C:\Iris\major proj\circular economy\backend\dataset"
node adapters/ingest_new_dataset.js raw/new_dataset.csv processed/new_dataset_processed.csv

# Verify output
Get-Content processed/new_dataset_processed.csv -Head 10

# Merge with other datasets
# Copy processed file to raw/ or update merge_datasets.ps1
```

---

## 🧪 Testing New Datasets

### **Test 1: CSV Parse Test**

```powershell
# Test if CSV is valid
$testData = Import-Csv "dataset\raw\new_dataset.csv" -ErrorAction Stop
Write-Host "✓ CSV is valid. Rows: $($testData.Count)"
```

### **Test 2: Column Mapping Test**

```powershell
# Test if required fields can be derived
$testData[0] | Format-List
# Manually verify you can map to: problem, solution, ID
```

### **Test 3: Chunking Test**

```powershell
# Test chunk creation with sample
node scripts/chunk.js dataset/samples/new_dataset_sample.csv dataset/chunks_test.json

# Verify chunks
node -e "console.log(require('./dataset/chunks_test.json').length)"
```

### **Test 4: Embedding Test (Dry Run)**

```powershell
# Test embedding generation
node scripts/embed_and_store.js dataset/chunks_test.json --dry-run

# Check output
Get-Content dataset/stored_documents.jsonl -Tail 5
```

### **Test 5: Search Quality Test**

After full integration:

```javascript
// Create test_new_dataset_search.js
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Test query related to new dataset
const testQuery = 'recycling plastic waste in packaging';

const embedding = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: testQuery,
});

const { data } = await supabase.rpc('match_documents', {
  query_embedding: embedding.data[0].embedding,
  match_count: 10,
});

// Check if results include new dataset
const newDataResults = data.filter((d) => d.metadata?.source_id?.startsWith('newdata_'));
console.log(`Found ${newDataResults.length} results from new dataset`);
console.log('Sample:', newDataResults[0]);
```

---

## 🐛 Troubleshooting Common Issues

### **Issue 1: CSV Parse Errors**

**Error:** `Unable to parse CSV`

**Solutions:**

```powershell
# Check encoding
[System.IO.File]::ReadAllText("path/to/file.csv") | Out-File -Encoding UTF8 "fixed.csv"

# Check delimiter
Get-Content file.csv -Head 1
# If semicolon-separated, use:
Import-Csv file.csv -Delimiter ';'

# Remove problematic characters
(Get-Content file.csv) -replace '[^\x00-\x7F]', '' | Set-Content file_clean.csv
```

### **Issue 2: Chunks Too Short**

**Error:** `Skipping record X: Problem too short`

**Solutions:**

```powershell
# Adjust minimum length in .env
# Add these lines to .env:
MIN_PROBLEM_LENGTH=15
MIN_SOLUTION_LENGTH=15

# Or combine multiple columns
$problem = "$($row.title). $($row.description). $($row.details)"
```

### **Issue 3: No Chunks Generated**

**Error:** `Created 0 semantic chunks`

**Causes & Solutions:**

1. **All rows filtered out:**
   - Check MIN_PROBLEM_LENGTH and MIN_SOLUTION_LENGTH
   - Inspect raw data: `Import-Csv dataset.csv | Select-Object -First 5`
   - Check for all-caps text (rejected)

2. **Column mapping wrong:**
   - Verify column names: `Import-Csv dataset.csv | Get-Member`
   - Check mapping in merge script
   - Add debug output: `Write-Host "Problem: $problem"`

3. **Empty fields:**
   - Check for null/empty values: `$data | Where-Object { -not $_.problem }`
   - Provide defaults: `$problem = $row.problem || "Unknown problem"`

### **Issue 4: Embedding Errors**

**Error:** `Error generating embeddings for batch`

**Solutions:**

```powershell
# Check OpenAI API key
echo $env:OPENAI_API_KEY

# Reduce batch size in embed_and_store.js
# Change line: const BATCH_SIZE = 20; to:
const BATCH_SIZE = 10;

# Check chunk content length
node -e "const c = require('./dataset/chunks.json'); c.forEach(ch => { if (ch.content.length > 8000) console.log('Too long:', ch.id, ch.content.length); });"
```

### **Issue 5: Supabase Insert Errors**

**Error:** `Error inserting batch`

**Solutions:**

```powershell
# Check service role key (not anon key)
echo $env:SUPABASE_SERVICE_ROLE_KEY

# Verify table exists
# Run in Supabase SQL Editor:
SELECT * FROM documents LIMIT 1;

# Check RLS policies
# Ensure service role can insert
```

---

## 🎯 Best Practices

### **Do's ✅**

1. **Start Small**
   - Test with 100-200 rows first
   - Validate quality before processing full dataset

2. **Document Everything**
   - Record source URL
   - Note column mappings
   - Document any transformations
   - Update dataset/README.md

3. **Version Control**
   - Keep original raw files unchanged
   - Create processed versions separately
   - Tag commits when adding datasets

4. **Quality Over Quantity**
   - 100 high-quality records > 10,000 low-quality ones
   - Filter aggressively for relevance

5. **Test Incrementally**
   - Test CSV parsing
   - Test column mapping
   - Test chunking
   - Test embedding (dry run)
   - Test full pipeline

6. **Monitor Costs**
   - Use dry-run mode first
   - Estimate embedding costs: ~$0.0001 per 1000 tokens
   - Batch process large datasets during off-peak

### **Don'ts ❌**

1. **Don't Skip Validation**
   - Always inspect raw data first
   - Don't assume column names are correct

2. **Don't Mix Formats**
   - Keep consistent delimiter (comma)
   - Keep consistent encoding (UTF-8)
   - Standardize date formats

3. **Don't Ignore Licenses**
   - Check usage rights before integrating
   - Document license in README

4. **Don't Process Bad Data**
   - Filter out placeholder text
   - Remove test/example rows
   - Skip marketing copy

5. **Don't Forget Backups**
   - Backup Supabase before large updates
   - Keep original CSVs safe
   - Export existing data before regenerating

---

## 📚 Recommended Data Sources by Category

### **Waste Management**

| Source           | URL                                                | Format    | Update Frequency |
| ---------------- | -------------------------------------------------- | --------- | ---------------- |
| OECD Waste Stats | https://stats.oecd.org/Index.aspx?DataSetCode=MUNW | CSV       | Annual           |
| EPA WRRM         | https://www.epa.gov/warm                           | Excel/CSV | Bi-annual        |
| Eurostat Waste   | https://ec.europa.eu/eurostat/web/waste            | CSV       | Annual           |

### **Material Flows**

| Source                   | URL                                       | Format  | Update Frequency |
| ------------------------ | ----------------------------------------- | ------- | ---------------- |
| UNEP Material Flows      | https://www.resourcepanel.org/            | Excel   | Annual           |
| Circular Economy Toolkit | https://www.ellenmacarthurfoundation.org/ | Various | Quarterly        |

### **Product Lifecycle**

| Source          | URL                              | Format   | Update Frequency |
| --------------- | -------------------------------- | -------- | ---------------- |
| Ecoinvent       | https://ecoinvent.org/           | Database | Annual           |
| GaBi Database   | http://www.gabi-software.com/    | Database | Annual           |
| Open Food Facts | https://world.openfoodfacts.org/ | CSV/JSON | Daily            |

### **Industry-Specific**

**Textiles:**

- Fashion Transparency Index: https://www.fashionrevolution.org/
- Textile Exchange: https://textileexchange.org/

**Construction:**

- RICS Construction: https://www.rics.org/
- BuildingGreen: https://www.buildinggreen.com/

**Electronics:**

- E-Waste Monitor: https://ewastemonitor.info/
- EPA Electronics Donation: https://www.epa.gov/recycle/electronics-donation-and-recycling

**Agriculture:**

- FAO Statistics: https://www.fao.org/faostat/
- USDA Agricultural Data: https://www.nass.usda.gov/

---

## 🚀 Quick Reference Commands

### **Full Dataset Integration Pipeline**

```powershell
# 1. Download dataset
cd "backend/dataset/raw"
Invoke-WebRequest -Uri "URL" -OutFile "new_dataset.csv" -UseBasicParsing

# 2. Inspect
Get-Content new_dataset.csv -Head 10

# 3. Create sample
Import-Csv new_dataset.csv | Select-Object -First 200 | Export-Csv ../samples/new_dataset_sample.csv -NoTypeInformation

# 4. Update merge script
# Edit merge_datasets.ps1 to include new dataset

# 5. Merge
cd ..
powershell -ExecutionPolicy Bypass -File merge_datasets.ps1

# 6. Chunk
cd ..
node scripts/chunk.js dataset/combined_input.csv dataset/chunks.json

# 7. Dry run
node scripts/embed_and_store.js --dry-run

# 8. Real embedding
node scripts/embed_and_store.js

# 9. Test
node scripts/test_e2e_pipeline.js

# 10. Verify
powershell -ExecutionPolicy Bypass -File verify_setup.ps1
```

---

## 📝 Dataset Addition Template

Copy this template for each new dataset:

```markdown
# Dataset Addition Record

**Date Added:** YYYY-MM-DD
**Added By:** Your Name
**Dataset Name:** Name of Dataset

## Source Information

- **URL:** https://...
- **License:** CC-BY-4.0 / Public Domain / etc.
- **Last Updated:** YYYY-MM-DD
- **Update Frequency:** Annual / Quarterly / etc.

## Dataset Details

- **Format:** CSV / JSON / Excel
- **Size:** XX MB
- **Rows:** XXXX
- **Columns:** XX
- **Language:** English

## Integration Details

- **Column Mapping:**
  - original_col1 → problem
  - original_col2 → solution
  - etc.

- **Transformation Logic:**
  - Describe any special transformations
  - Note filtering criteria

- **Quality Metrics:**
  - Rows processed: XXX
  - Rows filtered: XXX
  - Chunks created: XXX

## Testing Results

- [ ] CSV parse successful
- [ ] Column mapping validated
- [ ] Chunking successful
- [ ] Dry run passed
- [ ] Embeddings generated
- [ ] Search quality verified

## Notes

- Any special considerations
- Known issues
- Future improvements
```

---

## ✅ Final Checklist

Before marking a dataset as "integrated":

- [ ] Raw CSV saved in `dataset/raw/`
- [ ] Sample created in `dataset/samples/`
- [ ] Merge script updated
- [ ] Chunks generated successfully
- [ ] Dry run completed
- [ ] Embeddings stored in Supabase
- [ ] End-to-end test passed
- [ ] Documentation updated
- [ ] Source and license recorded
- [ ] Search quality validated

---

**Happy Dataset Hunting! 🎉**

Remember: Quality over quantity. One excellent dataset with rich problem-solution pairs is worth more than ten mediocre ones.

---

**Last Updated:** February 2026
**Version:** 1.0

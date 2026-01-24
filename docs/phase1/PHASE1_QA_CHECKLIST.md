# Phase 1 QA & Validation Checklist

## Backend API Testing

### Metadata Extraction Tests

- [ ] **Test 1: Packaging Industry**

  ```bash
  Problem: "Single-use plastic waste..."
  Solution: "Our AI sorting system for plastic recycling..."
  Expected: industry = "packaging", r_strategy = "recycling"
  ```

- [ ] **Test 2: Agriculture Industry**

  ```bash
  Problem: "Pesticide runoff from farming..."
  Solution: "Regenerative farming practices..."
  Expected: industry = "agriculture", r_strategy = "regeneration"
  ```

- [ ] **Test 3: Electronics Industry**

  ```bash
  Problem: "E-waste from discarded phones..."
  Solution: "Modular phone design for disassembly..."
  Expected: industry = "electronics", primary_material = "electronics"
  ```

- [ ] **Test 4: Textiles Industry**

  ```bash
  Problem: "Fast fashion waste..."
  Solution: "Textile fiber recovery system..."
  Expected: industry = "textiles", primary_material = "textile"
  ```

- [ ] **Test 5: Ambiguous Input**
  ```bash
  Problem: "Reduce costs..."
  Solution: "Cut expenses..."
  Expected: industry = "other", reasonable fallbacks
  ```

### Gap Analysis Tests

- [ ] **Test 6: Gap Analysis with Benchmarks**
  - Submit scoring request
  - Check response includes `gap_analysis.has_benchmarks = true`
  - Verify `overall_benchmarks` has all required fields
  - Check `sub_score_gaps` has entries for at least 3 factors

- [ ] **Test 7: Synthetic Benchmarks**
  - With limited database records
  - Verify synthetic benchmark formula: 30 + (similarity × 60)
  - Confirm reasonable score distribution (not all 90s or all 30s)

- [ ] **Test 8: Percentile Calculation**
  - User score = 70
  - Benchmark average = 75
  - Gap should = 5
  - Percentile should be between 0-100

- [ ] **Test 9: Factor-Specific Gaps**
  - Check each sub_score factor has unique benchmark
  - Verify gaps are not all identical (would indicate error)
  - Confirm percentiles vary (not all 50th)

- [ ] **Test 10: No Benchmark Data Gracefully**
  - Delete test records from database
  - Submit new request
  - Should return `has_benchmarks = false`
  - No error should occur

### API Response Structure Tests

- [ ] **Test 11: Complete Response**
  - Verify response has all required top-level fields:
    - `overall_score`
    - `confidence_level`
    - `sub_scores`
    - `metadata` (NEW)
    - `gap_analysis` (NEW)
    - `audit`
    - `similar_cases`

- [ ] **Test 12: Metadata Structure**
  - Verify all 5 classification fields present
  - All values are strings
  - No null/undefined values (use fallbacks)

- [ ] **Test 13: Gap Analysis Structure**
  - `has_benchmarks` is boolean
  - If true: `overall_benchmarks` and `sub_score_gaps` exist
  - If false: `message` field explains why

- [ ] **Test 14: Response Size**
  - Response JSON < 50KB
  - No performance regression vs. baseline

### Error Handling Tests

- [ ] **Test 15: Invalid Input Rejection**
  - Problem < 200 chars → 400 error
  - Solution < 200 chars → 400 error
  - Missing parameters → 400 error
  - Non-numeric scores → 400 error

- [ ] **Test 16: Database Connection Failure**
  - Disable Supabase connection
  - Request should still complete with `gap_analysis.has_benchmarks = false`
  - No 500 error (graceful degradation)

- [ ] **Test 17: OpenAI API Failure**
  - Disable OpenAI key
  - Metadata should use fallbacks
  - Request should not fail

- [ ] **Test 18: Malformed Similar Cases**
  - Database returns docs without proper structure
  - Gap analysis should handle gracefully
  - No crashes

## Database Testing

### Schema Tests

- [ ] **Test 19: Documents Table**

  ```sql
  SELECT * FROM information_schema.columns
  WHERE table_name='documents'
  ```

  - Verify `embedding` column exists (VECTOR type)
  - Verify `metadata` column exists (JSONB type)

- [ ] **Test 20: Metadata Storage**

  ```sql
  SELECT metadata FROM documents LIMIT 1
  ```

  - Verify contains: industry, scale, r_strategy, primary_material, geographic_focus
  - All as strings (not objects)

- [ ] **Test 21: Industry Search Function**

  ```sql
  SELECT * FROM pg_proc WHERE proname='search_documents_by_industry'
  ```

  - Function should exist
  - Should have proper return type

- [ ] **Test 22: Industry Filtering**
  ```sql
  SELECT COUNT(*) FROM search_documents_by_industry(
    (SELECT embedding FROM documents LIMIT 1),
    'packaging'::text,
    10
  )
  ```

  - Should return 0-10 results
  - No errors

### Index Tests

- [ ] **Test 23: Vector Index**

  ```sql
  SELECT * FROM pg_indexes
  WHERE tablename='documents' AND indexname LIKE '%embedding%'
  ```

  - Index should exist
  - Type should be ivfflat

- [ ] **Test 24: Metadata Index**
  ```sql
  SELECT * FROM pg_indexes
  WHERE tablename='documents' AND indexname LIKE '%metadata%'
  ```

  - GIN index should exist

## Frontend Testing

### Visual Rendering Tests

- [ ] **Test 25: Benchmark Card Visible**
  - After scoring, card appears between Executive Summary and Integrity Analysis
  - Background color is light blue (#f0f4f8)
  - Title is "📊 Your Performance vs. Similar Projects"

- [ ] **Test 26: Benchmark Metrics Display**
  - Four metric boxes visible:
    - Your Score (green)
    - Similar Projects Average (blue)
    - Top 10% Threshold (purple)
    - Median (teal)
  - Values are numbers, not NaN/undefined

- [ ] **Test 27: Factor Analysis Grid**
  - Shows 3-4 factors per row (responsive)
  - Each factor shows:
    - Factor name (capitalized)
    - Your Score (left side)
    - Benchmark (right side)
    - Gap indicator (colored)
    - Percentile text

- [ ] **Test 28: Gap Indicators**
  - Green checkmark (✓) for above-benchmark scores
  - Orange arrow (↑) for below-benchmark scores
  - Text shows point difference

- [ ] **Test 29: Classification Card**
  - Green background (#e8f5e9) appears below benchmarking
  - Shows 5 fields in responsive grid:
    - Industry
    - Scale
    - Strategy (r_strategy)
    - Material Focus
    - Geographic Focus
  - All values display correctly

- [ ] **Test 30: Responsive Design**
  - **Desktop (1920px)**: 4-column grid
  - **Tablet (768px)**: 2-column grid
  - **Mobile (375px)**: Single column
  - No overflow or text wrapping issues

### Data Display Tests

- [ ] **Test 31: Benchmark Number Formatting**
  - No decimal places (all integers)
  - No NaN, Infinity, or undefined
  - Reasonable ranges (30-95)

- [ ] **Test 32: Factor Names**
  - Properly formatted (e.g., "market_price" → "Market Price")
  - All factors from 8-factor framework present
  - No duplicates

- [ ] **Test 33: Percentile Display**
  - Format: "Xth percentile vs. similar projects"
  - Values between 0-100
  - Accurate reflection of gap calculation

- [ ] **Test 34: Missing Data Handling**
  - If benchmarks unavailable: card shows message (not empty)
  - If metadata missing: falls back to "N/A" or generic value
  - No broken layouts

### Interaction Tests

- [ ] **Test 35: Scrolling Performance**
  - Page scrolls smoothly
  - No jank or stuttering when rendering cards
  - Mobile: scrolling doesn't freeze

- [ ] **Test 36: Mobile Touch**
  - Cards are touchable without precision required
  - Text is readable at mobile font size
  - No horizontal scroll needed

## End-to-End Integration Tests

- [ ] **Test 37: Full Workflow**
  1. Open frontend
  2. Fill in problem/solution
  3. Set all scores
  4. Submit
  5. Wait for results
  6. Verify all three new sections appear
  7. Values are coherent with input

- [ ] **Test 38: Different Industries**
  - Submit 5 different industry ideas
  - Each shows correct industry classification
  - Benchmarks differ appropriately by industry

- [ ] **Test 39: Score Variation Impact**
  - Submit same problem twice: once with high scores, once low
  - Gap analysis changes appropriately
  - Benchmarks stay consistent (from database)
  - Gaps show different magnitudes

- [ ] **Test 40: Data Persistence**
  - Submit request A, get results
  - Submit request B, get results
  - Return to request A results (if URL preserved)
  - Data should match original response

## Performance Tests

- [ ] **Test 41: API Response Time**
  - Metadata extraction: < 1s
  - Full request: < 3s
  - No timeout errors

- [ ] **Test 42: Frontend Rendering**
  - Gap analysis card renders < 100ms
  - Classification card renders < 100ms
  - No layout shift after load

- [ ] **Test 43: Database Query Performance**
  - Industry filter completes < 500ms
  - No database timeouts
  - Index is being used (check EXPLAIN)

- [ ] **Test 44: Large Result Set**
  - Database has 1000+ documents
  - Queries still complete in reasonable time
  - No memory leaks

## Cross-Browser Testing

- [ ] **Test 45: Chrome/Edge**
  - All features render correctly
  - No console errors
  - Styling intact

- [ ] **Test 46: Firefox**
  - Colors display correctly
  - Grid layout responsive
  - No CSS issues

- [ ] **Test 47: Safari**
  - Fonts render properly
  - Spacing correct
  - Colors accurate

- [ ] **Test 48: Mobile Browsers**
  - Chrome Mobile
  - Safari iOS
  - Samsung Internet
  - Touch interactions work

## Accessibility Testing

- [ ] **Test 49: Screen Reader Compatibility**
  - Card headings are announced
  - Numbers are readable
  - No empty elements

- [ ] **Test 50: Color Contrast**
  - Text has sufficient contrast ratio (4.5:1+)
  - Color-blind friendly (not red/green only)
  - Metrics readable without color

- [ ] **Test 51: Keyboard Navigation**
  - Tab through all interactive elements
  - No elements unreachable via keyboard
  - Focus visible

## Regression Tests

- [ ] **Test 52: Existing Features Still Work**
  - Executive summary displays
  - Integrity analysis shows
  - Evidence cards appear
  - Recommendations load
  - Audit verdict present

- [ ] **Test 53: No Breaking Changes**
  - Old API response field still present
  - Sub-scores unchanged
  - Overall score unchanged
  - No data format changes to existing fields

- [ ] **Test 54: Database Backward Compatibility**
  - Old documents without metadata still work
  - Queries handle missing metadata gracefully
  - No 500 errors on old data

## Test Data

### Sample Industry Data

**Packaging (Plastic):**

```
Problem: Single-use plastic waste accumulates in landfills
Solution: AI sorting system for plastic recycling
```

**Agriculture (Organic):**

```
Problem: Pesticide residues contaminate soil
Solution: Regenerative agriculture certification program
```

**Electronics (Metals):**

```
Problem: E-waste contains valuable rare earth metals
Solution: Robotic disassembly for material recovery
```

**Textiles:**

```
Problem: Fast fashion generates massive waste
Solution: Fiber-to-fiber recycling technology
```

**Energy:**

```
Problem: Coal dependency creates emissions
Solution: Solar farm network for communities
```

## Acceptance Criteria

✅ All 54 tests pass
✅ No console errors (warnings OK)
✅ Response time < 3s
✅ Mobile renders correctly
✅ Benchmarks reasonable (30-95 range)
✅ Gap analysis actionable
✅ Metadata accurate per industry
✅ No database errors
✅ Frontend responsive
✅ Accessibility baseline met

## Sign-Off

- **Tested by:** ******\_\_\_\_******
- **Date:** ******\_\_\_\_******
- **Notes:** ******\_\_\_\_******
- **Ready for production:** ☐ YES ☐ NO

---

**Test Suite Version:** 1.0.0
**Last Updated:** 2024
**Estimated Duration:** 2-3 hours

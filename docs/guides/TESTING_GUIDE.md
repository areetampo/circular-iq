# Quick Test Guide - Verification Checklist

## Testing the Improvements

### 1. CSV Export Test ✅

**Steps:**

1. Go to Results view for any assessment
2. Click "📥 Similar Cases CSV" button at bottom
3. Check that download starts
4. Open downloaded CSV file in text editor or Excel

**What to Verify:**

- [ ] File downloads successfully
- [ ] File name is `assessment-summary-{date}.csv`
- [ ] Header shows "CIRCULAR ECONOMY ASSESSMENT EXPORT"
- [ ] Overall Score appears and is not N/A
- [ ] Industry/Scale/Strategy/Material all populated
- [ ] Factor Scores section shows all 10+ factors with values
- [ ] Audit Verdict section has text (not blank/N/A)
- [ ] Identified Strengths section shows bullet points (not N/A)
- [ ] Areas for Improvement section has content (not N/A)
- [ ] Reference Cases section appears with case names

**Expected Result:** Professional, complete assessment export - no N/A values for core data

---

### 2. PDF Export Test ✅

**Steps:**

1. Go to Results view for any assessment
2. Click "📄 Download as PDF" button at bottom
3. Browser print dialog opens
4. Click "Save as PDF" (or "Save" depending on browser)
5. Choose location and confirm save

**What to Verify:**

- [ ] Print dialog opens (not new blank window)
- [ ] Document preview shows text content (not blank images)
- [ ] Header section shows "Circular Economy Audit Report"
- [ ] Overall Score displays prominently
- [ ] Project Classification shows: Industry, Scale, Strategy, Material
- [ ] Auditor's Verdict section has full text
- [ ] Factor Scores table shows all factors
- [ ] Identified Strengths bullet list appears
- [ ] Areas for Improvement list appears
- [ ] Benchmarking table shows your score vs. averages
- [ ] Document is 2-3 pages (reasonable length)
- [ ] When opened in PDF viewer, all text is readable and selectable

**Expected Result:** Professional text-based PDF document, readable in any PDF viewer

---

### 3. Comparison View Insights Test ✅

**Steps:**

1. Go to Home > "View History" or Results page
2. Select two different assessments to compare
3. Look at the top of the comparison view after header

**What to Verify - When Assessment 2 is HIGHER than Assessment 1:**

- [ ] "Key Insights" section appears with 📈 icon
- [ ] Shows message like "Significant improvement: +X point gain"
- [ ] Shows strongest improvement area: "Strongest improvement in [Factor] (+X points)"
- [ ] Shows top performer: "💪 [Factor] is a strength (X/100)"
- [ ] Icons and colors are correct (green for positive)

**What to Verify - When Assessment 2 is LOWER than Assessment 1:**

- [ ] Shows decline message: "📉 Decline detected: -X point drop"
- [ ] Shows weakest area with red styling
- [ ] Icons show negative/warning states

**What to Verify - When Assessment 2 equals Assessment 1:**

- [ ] Shows stability message: "➡️ Overall scores remain stable"
- [ ] Neutral styling applied

**What to Verify - General:**

- [ ] 3-5 insights appear (not too many, not too few)
- [ ] Each insight has emoji icon
- [ ] Insights are relevant and accurate to the data
- [ ] Section comes BEFORE detailed comparison metrics
- [ ] Styling is professional and non-intrusive

**Expected Result:** Smart, relevant insights guide interpretation of comparison

---

### 4. Market Analysis Insights Test ✅

**Steps:**

1. Go to Results view
2. Click "View Market Analysis" button or similar
3. Scroll below "Market Overview" section

**What to Verify:**

- [ ] "Key Market Insights" section appears with 📈 icon
- [ ] Section has orange/yellow background (distinct styling)
- [ ] Shows 3-4 insight boxes in a grid
- [ ] Each insight has icon, title, and description
- [ ] Insights include:
  - Performance positioning ("Top Performer," "Above Market," "Growth Opportunity")
  - Market Leaders showing top industries and scores
  - Score variability insight
- [ ] Example: "Your score (X) is significantly above average (Y)"
- [ ] Icons are colorful and relevant (🏆 for top, 📊 for data, etc.)
- [ ] Text is readable and informative

**What to Verify - Market Data:**

- [ ] Overall score comparison shows correctly
- [ ] Industry name displays
- [ ] Percentile ranking calculates correctly
- [ ] Market average, median, max, min all show

**Expected Result:** Dashboard feels comprehensive with multiple data angles

---

### 5. Integration Test ✅

**Steps:**

1. Complete a new assessment start-to-finish
2. Go to Results
3. Test export (CSV and PDF)
4. Test Market Analysis
5. Create two assessments and test Comparison

**What to Verify:**

- [ ] All data flows correctly through the pipeline
- [ ] No errors in browser console
- [ ] No "undefined" or "N/A" values where data should exist
- [ ] All three export scenarios work smoothly
- [ ] UI is responsive on different screen sizes

---

## Common Issues to Watch For

| Issue                 | Cause                   | Fix                                     |
| --------------------- | ----------------------- | --------------------------------------- |
| CSV still shows N/A   | Old export still in use | Clear browser cache, reload             |
| PDF doesn't open      | Print dialog blocked    | Check browser permissions               |
| Insights don't appear | Data missing            | Check that assessment has complete data |
| CSV empty sections    | Backend data missing    | Verify assessment was scored fully      |

---

## Browser Testing

**Recommended Browsers:**

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Mobile Testing:**

- iOS Safari (iPad/iPhone)
- Chrome Mobile
- Firefox Mobile

---

## Performance Checks

**Should take <1 second:**

- [ ] CSV download initiated
- [ ] PDF print dialog opens
- [ ] Insights rendering on Comparison/Market Analysis pages
- [ ] Page transitions between views

**Should take <500ms:**

- [ ] Insights calculation
- [ ] CSV file generation

---

## Data Validation

**CSV Export should show:**

```
✓ Non-zero overall score
✓ Valid industry/scale/strategy
✓ All 10+ factor scores (0-100 range)
✓ Audit verdict text
✓ 1-5 strengths listed
✓ 1-5 challenges listed
✓ Benchmarking numbers
```

**PDF Export should show:**

```
✓ Header with title
✓ Overall score (0-100)
✓ Metadata section with 4 fields
✓ Verdict with full text
✓ Table with factor scores
✓ Strength bullets
✓ Improvement bullets
✓ Benchmarking table
✓ Footer with date
```

**Comparison Insights should mention:**

```
✓ Overall trend (improvement/decline/stable)
✓ Strongest factor change
✓ Weakest factor performance
✓ Top performer identification
✓ Priority area for improvement
```

**Market Insights should mention:**

```
✓ Performance positioning
✓ Market leader data
✓ Score variability/range
✓ Percentile ranking
```

---

## Sign-Off Criteria

✅ **All tests pass** when:

1. CSV exports complete data with no N/A values for core fields
2. PDF renders as readable text (not image pages)
3. Insights appear and are relevant on Comparison view
4. Market insights display with proper styling
5. All three features work together smoothly
6. No console errors appear
7. Mobile responsive testing succeeds
8. Browser compatibility verified (Chrome, Firefox, Safari, Edge)

---

## Reporting Issues

If you find an issue:

1. Note the exact steps to reproduce
2. Check browser console for errors (F12 > Console)
3. Take a screenshot
4. Include browser/OS information
5. Report whether it happens consistently or intermittently

---

**Last Updated:** Today
**Status:** Ready for Testing
**Target Completion:** All tests passing, all sign-off criteria met

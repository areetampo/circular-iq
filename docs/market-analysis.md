# Market Analysis — Enhancements

This document describes recent improvements to the Market Analysis page and how to use them.

## What's new

- Per-assessment comparisons (backend route `GET /api/assessments/market-analysis/:id`) now return:
  - `userScore`, `user_percentile`, `userIndustry`
  - `industry_benchmark` and `strategy_breakdown`
- Time-range controls: select `All`, `12m`, `24m`, `36m` and the industry trend chart will update accordingly.
- PDF export: export the Market Analysis view as a formatted PDF using the "Export PDF" button (client-side via `html2canvas` + `jsPDF`).
- CSV export: download the current market snapshot via "Export CSV" button.
- UI & accessibility tweaks: improved controls, ARIA attributes, and Tailwind token fixes.

## Testing

- Unit test added: `MarketAnalysisPage.test.jsx` checks presence of export buttons and time-range controls.

## Notes

- If you want more charts (market volatility, market price trend), we can extend the enhanced analytics endpoint and visualize them.
- Small Tailwind lint warnings were addressed by replacing a number of hex classes with theme tokens for consistency.

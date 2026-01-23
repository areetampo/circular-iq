# Test Cases Documentation

## File Location & Format

### Current Setup: ✅ RECOMMENDED

- **Location**: `backend/data/test-cases.json`
- **Format**: JSON

### Why This Setup is Optimal:

1. **JSON Format Advantages**:
   - Structured data with type safety
   - Easy to parse in React components
   - Can be directly imported as ES module in frontend
   - Supports nested objects for parameters
   - Better for programmatic access and type checking

2. **Frontend Data Directory Rationale**:
   - Test cases are centralized backend data, not frontend-specific
   - Placing in `backend/data/` follows data-as-a-resource pattern
   - Could be exposed via API in future for dynamic test case loading
   - The `data/` directory convention clearly indicates static/test data
   - Separate from code logic for better organization
   - Import path: `import testCases from '../../../backend/data/test-cases.json'`

3. **Alternative Locations Considered**:
   - ❌ `frontend/src/data/test-cases.json` - Couples test data to frontend
   - ❌ `backend/test-cases.json` - Less organized, not in dedicated data folder
   - ❌ `frontend/public/` - Would require fetch/ajax at runtime, adds complexity
   - ❌ Root level `test-cases.json` - Mixes with config files
   - ✅ `backend/data/test-cases.json` - **BEST CHOICE**

## Test Case Structure

Each test case contains:

```json
{
  "id": "unique-identifier",
  "name": "Display Name",
  "category": "Industry Category",
  "problem": "Business problem (200+ chars)",
  "solution": "Business solution (200+ chars)",
  "parameters": {
    "tech_readiness": 0-100,
    "chemical_safety": 0-100,
    "market_price": 0-100,
    "infrastructure": 0-100,
    "public_participation": 0-100,
    "uniqueness": 0-100,
    "size_efficiency": 0-100,
    "maintenance": 0-100
  }
}
```

## Current Test Cases (12 Total)

### 1. Bio-Industrial Lubricants Loop

- **Category**: Industrial Chemicals
- **Focus**: Petroleum replacement with bio-based alternatives
- **Key Strength**: High chemical safety (95)
- **Key Challenge**: Low public participation (40)

### 2. Last-Mile Smart Bin Network

- **Category**: Urban Logistics
- **Focus**: E-commerce packaging reuse
- **Key Strength**: High public participation (95)
- **Key Challenge**: Low size efficiency (30)

### 3. Circuit-Harvest Robotics

- **Category**: E-Waste Recovery
- **Focus**: Component-level electronics recycling
- **Key Strength**: Extremely high uniqueness (98)
- **Key Challenge**: Very low maintenance score (25)

### 4. Fiber-to-Fiber Textile Regeneration

- **Category**: Fashion & Textiles
- **Focus**: Molecular-level textile recycling
- **Key Strength**: High uniqueness (88)
- **Balanced**: Well-rounded scores across parameters

### 5. Hyperlocal Anaerobic Digestion Network

- **Category**: Food Waste Management
- **Focus**: On-site food waste to biogas conversion
- **Key Strength**: High chemical safety (92)
- **Key Feature**: Modular, scalable design

### 6. Modular Building Material Passport System

- **Category**: Construction & Demolition
- **Focus**: Blockchain-based material traceability
- **Key Strength**: Very high uniqueness (91)
- **Key Challenge**: Low infrastructure (45)

### 7. Ocean Plastic Intercept & Remanufacture

- **Category**: Marine Conservation
- **Focus**: River mouth plastic interception
- **Key Strength**: High public participation (88)
- **Key Feature**: Revenue-generating cleanup model

### 8. EV Battery Second-Life Grid Storage

- **Category**: Energy Storage
- **Focus**: Retired EV battery repurposing
- **Key Strength**: High tech readiness (82)
- **Key Feature**: Cost-effective renewable energy storage

### 9. Agricultural Residue to Bioplastics

- **Category**: Agricultural Waste
- **Focus**: Crop residue conversion to PHA bioplastics
- **Key Strength**: High chemical safety (93)
- **Key Feature**: Eliminates open burning, creates farmer income

### 10. Industrial Water Membrane Circular System

- **Category**: Water Treatment
- **Focus**: Membrane leasing and regeneration service
- **Key Strength**: High uniqueness (89)
- **Key Feature**: Complete lifecycle management with IoT monitoring

### 11. Coffee Waste to Advanced Materials

- **Category**: Hospitality Waste
- **Focus**: Cascading value extraction from coffee grounds
- **Key Strength**: Very high chemical safety (94)
- **Key Feature**: Multiple revenue streams (cosmetics, hydrochar, composites)

### 12. Automated Tire Pyrolysis Network

- **Category**: Automotive Waste
- **Focus**: Containerized tire-to-fuel conversion
- **Key Strength**: High tech readiness (85)
- **Key Feature**: Distributed franchise model for scalability

## How to Add New Test Cases

1. Open `backend/data/test-cases.json`
2. Add new object to the `testCases` array
3. Ensure all required fields are present:
   - `id`: Unique kebab-case identifier
   - `name`: User-friendly display name
   - `category`: Industry/domain classification
   - `problem`: 200+ character problem description
   - `solution`: 200+ character solution description
   - `parameters`: All 8 parameters with values 0-100

4. Test case will automatically appear in the selector

## Usage in Development

The test case selector appears below the "Evaluate Circularity" button on the input page:

- Click to expand/collapse the test case grid
- Select any case to auto-fill the form
- Advanced parameters expand automatically
- Selected case is highlighted
- Useful for quick testing and demonstrations

## UI Design Philosophy

The test case selector uses **subdued, professional colors**:

- Neutral grays and whites for base colors
- Subtle borders and hover effects
- Color-coded parameter badges (green/yellow/red) for quick scanning
- GitHub-inspired color palette for familiarity
- No flashy gradients or bright colors
- Clean, minimal aesthetic that doesn't distract from main UI

## Production Deployment

For production builds, you may want to:

1. Add environment check to only show selector in development
2. Or keep it as a "demo mode" feature for user education
3. Consider adding authentication if keeping in production

Example environment check:

```javascript
{import.meta.env.DEV && <TestCaseSelector ... />}
```

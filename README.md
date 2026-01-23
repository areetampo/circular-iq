# 🌍 Circular Economy Business Auditor

**An AI-powered evaluation platform combining Retrieval-Augmented Generation (RAG) with deterministic scoring for reproducible, explainable circular economy assessments.**

---

## 📋 Project Overview

The Circular Economy Business Auditor is a full-stack web application that evaluates business ideas based on circular economy principles. The system uses a hybrid architecture:

- **Deterministic Scoring Engine**: Computes all numeric metrics using code-based algorithms
- **RAG-Powered Insights**: Leverages OpenAI embeddings and Supabase vector search to provide context-aware qualitative analysis
- **Evidence-Based Validation**: Cross-references user inputs against a curated dataset of 1,108 high-quality circular economy projects (filtered from 1,300 for data quality)

**Core Principle**: All numeric scores are calculated deterministically. The LLM only explains and contextualizes results—it never invents metrics.

### Key Features

✅ **Professional Assessment Tool** - No gamification, designed for consultants/investors
✅ **Two-Field Input System** - Separate Problem (200+ chars) and Solution (200+ chars) descriptions
✅ **8 Evaluation Parameters** - Weighted scoring across circular economy dimensions
✅ **Evidence-Based Analysis** - Every finding cites database projects
✅ **Gap Analysis & Benchmarking** - Real-time comparison vs. similar industry projects
✅ **Project Classification** - AI-extracted metadata (industry, scale, strategy, materials)
✅ **Industry-Filtered Search** - Semantic search preferred by classification category
✅ **Multi-Format Reports** - Download results as CSV or PDF
✅ **Enhanced Evidence Cards** - Shows problem + solution with visual similarity indicators
✅ **Comprehensive Details Modal** - Full context with similarity percentage and source case ID
✅ **Emerald Theme** - Professional color scheme (#34a83a primary)

---

## 🏗️ Technical Stack

### Frontend

- **Framework**: React 18 + Vite
- **Visualization**: Recharts (Radar charts for multi-dimensional analysis)
- **Styling**: Custom CSS with emerald (#34a83a) theme
- **State Management**: React Hooks (useState)

### Backend

- **Runtime**: Node.js with Express.js
- **AI Integration**: OpenAI GPT-4o-mini + text-embedding-3-small
- **Vector Database**: Supabase (pgvector for semantic search)
- **Data Processing**: Custom chunking and embedding pipeline

### Dataset

- **Source**: [GreenTechGuardians AI_EarthHack Dataset](https://github.com/techandy42/GreenTechGuardians)
- **Format**: CSV → Chunked JSON → Vector embeddings
- **Location**: `backend/dataset/GreenTechGuardians/AI_EarthHack_Dataset.csv`

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys:
# - OPENAI_API_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY

# Process dataset
npm run chunk      # Creates chunks.json
npm run embed      # Generates embeddings and stores in Supabase

# Start API server
npm start          # http://localhost:3001
```

# Create a .env file in frontend/ with:

# VITE_API_URL=http://localhost:3001

````

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev        # http://localhost:5173
````

---

## 🧮 The 8-Factor Evaluation Methodology

Our scoring framework evaluates business ideas across **three core value dimensions** and **eight specific factors**:

### 1️⃣ Access Value (30% of overall score) - Social & Logistical Accessibility

| Factor                   | Description                                                               | Weight |
| ------------------------ | ------------------------------------------------------------------------- | ------ |
| **Public Participation** | How easily can stakeholders engage? (ease of participation, transparency) | 15%    |
| **Infrastructure**       | Is supporting infrastructure available? (facilities, transport, systems)  | 15%    |

### 2️⃣ Embedded Value (35% of overall score) - Economic & Material Worth

| Factor           | Description                                                                             | Weight |
| ---------------- | --------------------------------------------------------------------------------------- | ------ |
| **Market Price** | Economic value and market demand for recovered or repurposed materials                  | 20%    |
| **Maintenance**  | Ease and cost of maintaining products, materials, or systems throughout their lifecycle | 10%    |
| **Uniqueness**   | Rarity, specialty, or distinctive value of materials and their potential for reuse      | 5%     |

### 3️⃣ Processing Value (35% of overall score) - Technical & Operational Feasibility

| Factor              | Description                                                                                | Weight |
| ------------------- | ------------------------------------------------------------------------------------------ | ------ |
| **Size Efficiency** | Physical dimensions and volume, affecting handling, storage, and transportation efficiency | 10%    |
| **Chemical Safety** | Potential environmental and health hazards, impacting safe processing and disposal methods | 15%    |
| **Tech Readiness**  | Complexity and availability of technology required for effective processing and recovery   | 10%    |

**Scoring Range**: Each factor is scored 0-100. The overall circularity score is a weighted composite of all factors.

---

## 🔄 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Input Form   │  │ Results View │  │ Criteria View│         │
│  │ (8 sliders)  │  │ (Radar chart)│  │ (Documentation)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER (Express.js)                      │
│                      POST /score endpoint                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  DETERMINISTIC SCORING   │  │  RAG PIPELINE            │
│  (scoring.js)            │  │  (ask.js)                │
│                          │  │                          │
│  • Computes sub_scores   │  │  1. Embed user idea      │
│  • Calculates overall    │  │  2. Query Supabase       │
│  • Returns numeric data  │  │  3. Inject context       │
│                          │  │  4. Generate reasoning   │
└──────────────────────────┘  └──────────────────────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │  SUPABASE PGVECTOR   │
                              │  match_documents()   │
                              │  (Top 3 similar)     │
                              └──────────────────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │  OPENAI API          │
                              │  • Embeddings        │
                              │  • GPT-4o-mini       │
                              └──────────────────────┘
```

---

## 📦 Setup Instructions

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd circular-economy-auditor
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
OPENAI_API_KEY=sk-your-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
EOF
```

### 3. Database Setup

**Run Supabase SQL:**

```sql
-- Execute backend/supabase/setup.sql in your Supabase SQL editor
-- This creates the documents table and match_documents function
```

**Ingest Dataset:**

```bash
# Step 1: Chunk the CSV dataset
node scripts/chunk.js

# Step 2: Generate embeddings and store in Supabase
node scripts/embed_and_store.js
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

### 5. Run the Application

**Terminal 1 - Backend:**

```bash
cd backend
node api/server.js
# Runs on http://localhost:3001
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## 🚀 Usage Guide

### Basic Workflow

1. **Enter Business Problem**: Describe the environmental/sustainability issue (minimum 200 characters) with specific metrics and context

2. **Enter Business Solution**: Explain your circular economy approach (minimum 200 characters) with materials, processes, and business model details

3. **Adjust Parameters** (Optional): Click "Advanced Parameter Calibration" to fine-tune the 8 evaluation factors using sliders (0-100)

4. **Load Test Cases** (Optional): Expand "Select Test Case" section to quickly load one of 12 pre-configured circular economy scenarios

5. **Evaluate**: Click "Evaluate Circularity" to receive:

- Overall circularity score (0-100) with confidence assessment
- 8 sub-scores with detailed breakdowns and improvement tips
- Interactive radar chart visualizing performance across all parameters
- AI-generated audit analysis with evidence-based reasoning
- Strengths and gaps categorization
- Actionable technical recommendations
- **Enhanced Similar Cases** with:
  - Color-coded similarity metrics (80%+ Excellent, 65%+ Strong, 50%+ Good)
  - Visual progress bars showing match percentage
  - Problem Addressed and Solution Approach preview (~200 chars each)
- Comprehensive methodology and criteria available via modals on both the input and results pages (top buttons)

6. **Explore Evidence**: Click "View Full Details" on any evidence card to see:

- Full problem and solution text with section dividers
- Similarity percentage and match strength in header
- Source case ID for reference

### Key Features

- **📋 Two-Field Input System**: Separate problem and solution descriptions for clarity
- **🧪 12 Test Cases**: Quick evaluation across diverse circular economy domains
- **📊 Multi-Dimensional Scoring**: Evaluate across Access, Embedded, and Processing value dimensions
- **🔍 Semantic Search**: Find similar projects from 1,108 high-quality verified circular economy cases
- **📈 Visual Analytics**: Interactive radar chart for performance comparison
- **🤖 AI Explanations**: Context-aware reasoning with strict integrity validation
- **🎯 Integrity Checks**: Flags unrealistic claims based on database evidence
- **💡 Comprehensive Evidence**: Each similar case shows both problem addressed and solution approach
- **💡 Enhanced Evidence Cards**: Similarity metrics, progress bars, problem + solution sections with comprehensive modal
- **ℹ️ Educational Modals**: Detailed guidance for writing problems, solutions, and understanding parameters
- **📚 Methodology Transparency**: Full explanation of scoring approach and data sources

---

## 📂 Project Structure

```
circular-economy-auditor/
├── backend/
│   ├── api/
│   │   └── server.js              # Express API server (port 3001)
│   ├── src/
│   │   ├── scoring.js             # Deterministic score calculation
│   │   └── ask.js                 # RAG-based AI reasoning with GPT-4o-mini
│   ├── scripts/
│   │   ├── chunk.js               # Dataset chunking (CSV → JSON)
│   │   └── embed_and_store.js     # Embedding generation & Supabase storage
│   ├── supabase/
│   │   └── setup.sql              # Database schema & vector search function
│   ├── data/
│   │   └── test-cases.json        # 12 pre-configured test scenarios
│   ├── dataset/
│   │   ├── chunks.json            # Processed chunks (generated)
│   │   └── GreenTechGuardians/
│   │       └── AI_EarthHack_Dataset.csv  # 1,300 records (1,108 high-quality after filtering)
│   └── .env                       # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main orchestration component
│   │   ├── App.css                # Global styles
│   │   ├── views/
│   │   │   ├── LandingView.jsx    # Input form with top buttons to open Methodology/Criteria modals
│   │   │   ├── ResultsView.jsx    # Results display; same top buttons open Methodology/Criteria modals
│   │   │   └── EvaluationCriteriaView.jsx  # (Referenced) documentation, now also available as a modal
│   │   ├── components/
│   │   │   ├── EvidenceCard.jsx   # Similar case display (problem + solution)
│   │   │   ├── ContextModal.jsx   # Full case details modal
│   │   │   ├── MetricInfoModal.jsx  # Educational guidance modals
│   │   │   ├── ParameterSliders.jsx # Parameter adjustment UI
│   │   │   ├── RadarChartSection.jsx # Radar chart visualization
│   │   │   └── TestCaseSelector.jsx  # Test case loader
│   │   ├── constants/
│   │   │   └── evaluationData.js  # Parameter definitions
│   │   └── utils/
│   │       └── helpers.js         # Utility functions
│   └── package.json
├── README.md                      # This file
├── ARCHITECTURE.md                # Detailed system design
├── API_DOCUMENTATION.md           # Complete API reference
└── DEVELOPER_ONBOARDING.md        # Onboarding guide
```

---

## 🔬 How It Works

### Deterministic Scoring (`scoring.js`)

```javascript
export function calculateScores(parameters) {
  // Pure mathematical computation
  const weights = {
    public_participation: 0.15,
    infrastructure: 0.15,
    market_price: 0.2,
    // ... etc
  };

  const overall_score = Object.keys(weights).reduce((sum, key) => {
    return sum + parameters[key] * weights[key];
  }, 0);

  return { overall_score, sub_scores: parameters };
}
```

### RAG Pipeline (`ask.js`)

1. **Embed user input**: `text-embedding-3-small` converts combined problem + solution to 1536-dim vector
2. **Similarity search**: Supabase `match_documents()` finds top 5 most similar cases
3. **Context injection**: Retrieved cases are formatted into the LLM prompt with strict integrity rules
4. **Structured output**: GPT-4o-mini generates JSON with:
   - `confidence_score`: AI's confidence in the evaluation
   - `audit_verdict`: Overall assessment summary
   - `alignment`: Circular economy principles alignment analysis
   - `strengths`: List of identified strong points
   - `gaps`: List of improvement areas
   - `recommendations`: Actionable technical improvements
   - `is_junk_input`: Boolean flag for invalid/vague inputs

---

## 🎨 UI Features

### Input Phase (LandingView)

- **Two-Field System**: Separate Business Problem and Business Solution inputs
- **Character Validation**: Minimum 200 characters per field with live counter
- **Info Icons**: Educational modals with comprehensive writing guidance
- **Test Case Selector**: Inline collapsible section with 12 pre-configured scenarios
- **Parameter Sliders**: 8 adjustable weights (0-100) with descriptions and methodology tips
- **Professional Design**: GitHub-inspired neutral colors for test selector

### Results Phase (ResultsView)

- **Executive Summary**:
  - Overall circularity score with confidence badge
  - Quick stats grid (score, cases analyzed, strengths, improvements)
  - Light gray background with dark text for readability
- **Radar Chart**: Interactive 8-dimensional performance visualization
- **Score Breakdown**: 8 parameter cards with scores, descriptions, and improvement tips
- **Enhanced Database Evidence Cards**:
  - **Similarity Metrics**: Percentage badge + color-coded match strength label (Excellent/Strong/Good/Moderate)
  - **Visual Progress Bar**: Animated similarity indicator with color matching
  - 🎯 **Problem Addressed** section (~200 chars)
  - 💡 **Solution Approach** section (~200 chars)
  - **"View Full Details" Modal**: Complete context with:
    - Similarity percentage and match strength in header
    - Source case ID badge
    - Full problem and solution text with section dividers
- **Audit Analysis**: AI-generated insights with alignment, strengths, gaps, recommendations
- **Methodology Section**: Transparent explanation of scoring approach and data sources

---

## 🧪 Test Cases

The system includes **12 comprehensive test cases** covering diverse circular economy domains. These are located in `backend/data/test-cases.json` and can be loaded via the "Select Test Case" section in the input form.

### Available Test Cases

1. **Bio-Industrial Lubricants** - Transforming industrial waste into high-performance lubricants
2. **Smart Bin Network** - Urban logistics optimization with IoT-enabled waste collection
3. **Circuit-Harvest Robotics** - Automated e-waste recovery with AI-powered disassembly
4. **Textile Regeneration** - Fashion industry circularity with fiber-to-fiber recycling
5. **Anaerobic Digestion Hub** - Food waste to renewable energy conversion
6. **Building Material Passport** - Construction material tracking and reuse platform
7. **Ocean Plastic Intercept** - Marine waste recovery at river mouths
8. **EV Battery Second-Life** - Energy storage systems from retired vehicle batteries
9. **Agricultural Bioplastics** - Farm waste conversion to biodegradable packaging
10. **Water Membrane Regeneration** - Industrial water treatment system with circular design
11. **Coffee Waste Materials** - Hospitality waste utilization for consumer products
12. **Tire Pyrolysis Plant** - Automotive waste processing into valuable materials

Each test case includes:

- Comprehensive problem description (200+ characters)
- Detailed solution approach (200+ characters)
- Pre-configured parameter weights optimized for that domain

**Usage:**

1. Expand "Select Test Case" below the Evaluate button
2. Browse cases in grid layout
3. Click "Load" to populate all fields
4. Advanced parameters auto-expand with pre-set values
5. Evaluate as-is or modify before submission

---

## 🔐 Security & Best Practices

<!-- - ✅ API keys stored in `.env` (never committed)
- ✅ Input validation (length, format, junk detection)
- ✅ Supabase Row-Level Security (RLS) enabled
- ✅ CORS configured for local development
- ✅ Error handling with user-friendly messages -->

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

<!-- This project is licensed under the MIT License. -->

---

## 🙏 Acknowledgments

- Dataset: [GreenTechGuardians](https://github.com/techandy42/GreenTechGuardians)
- Circular Economy Framework: Based on Ellen MacArthur Foundation principles
- Icons: Custom SVG designs

---

## 📞 Support

For issues, questions, or suggestions:

- Open a GitHub issue
<!-- - Email: support@circulareconomyauditor.com -->

---

**Built with ♻️ for a sustainable future**

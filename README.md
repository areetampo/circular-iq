# 🌍 Circular Economy Business Auditor

**An AI-powered evaluation platform combining Retrieval-Augmented Generation (RAG) with deterministic scoring for reproducible, explainable circular economy assessments.**

**Status**: ✅ Production Ready | Backend 100% | Frontend 100% | Database 100%

---

## 📋 Project Overview

The Circular Economy Business Auditor is a full-stack web application that evaluates business ideas based on circular economy principles. The system uses a hybrid architecture:

- **Deterministic Scoring Engine**: Computes all numeric metrics using code-based algorithms
- **RAG-Powered Insights**: Leverages OpenAI embeddings and Supabase vector search to provide context-aware qualitative analysis
- **Evidence-Based Validation**: Cross-references user inputs against a curated dataset of 1,108 high-quality circular economy projects

**Core Principle**: All numeric scores are calculated deterministically. The LLM only explains and contextualizes results—it never invents metrics.

### Key Features

#### Core Assessment

- ✅ Professional tool designed for consultants, investors, and sustainability professionals
- ✅ Two-field input system: Problem (200+ chars) and Solution (200+ chars) descriptions
- ✅ 8-factor deterministic scoring with configurable parameters
- ✅ Evidence-based analysis citing verified circular economy projects
- ✅ Gap analysis & benchmarking vs. industry-comparable projects

#### AI-Powered Insights

- ✅ RAG pipeline with GPT-4o-mini for context-aware reasoning
- ✅ Semantic search using vector embeddings
- ✅ Automatic project classification (industry, scale, strategy, materials)
- ✅ Confidence scoring and integrity validation

#### Multi-Assessment Features

- ✅ Assessment history with full CRUD operations
- ✅ Side-by-side comparison of multiple assessments
- ✅ Market analytics dashboard with competitive benchmarking
- ✅ Real-time visualization across multiple dimensions

#### Professional Output

- ✅ Interactive radar charts and performance visualizations
- ✅ Evidence cards with similarity metrics and source citations
- ✅ Export to CSV and PDF formats
- ✅ Responsive design (mobile, tablet, desktop)

---

## 🏗️ Technical Stack

### Frontend

- **Framework**: React 18 + Vite
- **Routing**: React Router v7 (full multi-page SPA with real URLs)
- **Visualization**: Recharts (Radar, Bar, Scatter, Line charts)
- **Styling**: Tailwind CSS v3 + Custom CSS
- **State Management**: React Hooks (useState, useContext, custom hooks)

### Backend

- **Runtime**: Node.js with Express.js
- **AI Integration**: OpenAI GPT-4o-mini + text-embedding-3-small
- **Vector Database**: Supabase (pgvector for semantic search)
- **Data Processing**: Custom chunking and embedding pipeline
- **Assessment System**: PostgreSQL via Supabase with Row-Level Security

### Dataset

- **Source**: [GreenTechGuardians AI_EarthHack Dataset](https://github.com/techandy42/GreenTechGuardians)
- **Size**: 1,108 verified circular economy projects
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
```

### 2. Frontend Setup

Create a `.env` file in `frontend/` with:

```env
VITE_API_URL=http://localhost:3001
```

Then install dependencies:

```bash
cd frontend
npm install
```

### 3. Run the Application

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

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│                       USER INTERFACE (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Input Form   │  │ Results View │  │ Assessment   │          │
│  │ (8 sliders)  │  │ (Radar chart)│  │ History      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
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
                              │  (Top 5 similar)     │
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

## 📂 Project Structure

```
circular-economy-auditor/
├── backend/
│   ├── api/
│   │   └── server.js              # Express API server (port 3001)
│   ├── src/
│   │   ├── scoring.js             # Deterministic score calculation
│   │   └── ask.js                 # RAG-based AI reasoning
│   ├── scripts/
│   │   ├── chunk.js               # Dataset chunking
│   │   └── embed_and_store.js     # Embedding generation & storage
│   ├── supabase/
│   │   └── setup.sql              # Database schema & vector search
│   ├── data/
│   │   └── test-cases.json        # 12 test scenarios
│   └── dataset/
│       └── GreenTechGuardians/
│           └── AI_EarthHack_Dataset.csv
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main orchestration
│   │   ├── views/
│   │   │   ├── LandingView.jsx    # Input form
│   │   │   ├── ResultsView.jsx    # Results display
│   │   │   ├── HistoryView.jsx    # Assessment history
│   │   │   ├── ComparisonView.jsx # Side-by-side comparison
│   │   │   ├── MarketAnalysisView.jsx # Analytics dashboard
│   │   │   └── EvaluationCriteriaView.jsx # Methodology
│   │   ├── components/            # 15+ reusable components
│   │   ├── constants/             # Parameter definitions
│   │   └── utils/                 # Helper functions
│   └── package.json
├── README.md                      # This file
├── PROJECT_MANIFEST.md            # Project metadata
└── docs/                          # Documentation
    ├── INDEX.md
    ├── DEVELOPMENT.md
    ├── ARCHITECTURE.md
    ├── architecture/              # API & database specs
    └── guides/                    # Setup, testing, changelog
```

---

## 🧪 Test Cases

The system includes **12 comprehensive test cases** covering diverse circular economy domains. These can be loaded via the "Select Test Case" section in the input form.

### Available Test Cases

1. **Bio-Industrial Lubricants** - Industrial waste into high-performance lubricants
2. **Smart Bin Network** - Urban logistics optimization with IoT
3. **Circuit-Harvest Robotics** - Automated e-waste recovery
4. **Textile Regeneration** - Fashion industry fiber-to-fiber recycling
5. **Anaerobic Digestion Hub** - Food waste to renewable energy
6. **Building Material Passport** - Construction material tracking
7. **Ocean Plastic Intercept** - Marine waste recovery
8. **EV Battery Second-Life** - Energy storage from retired batteries
9. **Agricultural Bioplastics** - Farm waste to biodegradable packaging
10. **Water Membrane Regeneration** - Industrial water treatment
11. **Coffee Waste Materials** - Hospitality waste to consumer products
12. **Tire Pyrolysis Plant** - Automotive waste processing

---

## 📚 Documentation

**Getting Started:**

- 📖 [docs/INDEX.md](docs/INDEX.md) - Full documentation index
- 🚀 [docs/guides/QUICKSTART.md](docs/guides/QUICKSTART.md) - Quick start guide
- 👥 [docs/guides/DEVELOPER_ONBOARDING.md](docs/guides/DEVELOPER_ONBOARDING.md) - Setup guide

**Key References:**

- 🏗️ [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design overview
- 📡 [docs/architecture/API_DOCUMENTATION.md](docs/architecture/API_DOCUMENTATION.md) - API reference
- 🗄️ [docs/architecture/DATABASE_ARCHITECTURE.md](docs/architecture/DATABASE_ARCHITECTURE.md) - Database schema
- ✅ [docs/guides/TESTING_GUIDE.md](docs/guides/TESTING_GUIDE.md) - Testing procedures

---

## 🔬 How It Works

### Deterministic Scoring (scoring.js)

All numeric scores are calculated purely mathematically:

```javascript
export function calculateScores(parameters) {
  // Pure mathematical computation - no randomness
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

### RAG Pipeline (ask.js)

1. **Embed user input**: `text-embedding-3-small` converts problem + solution to 1536-dim vector
2. **Similarity search**: Supabase `match_documents()` finds top 5 most similar cases
3. **Context injection**: Retrieved cases formatted into LLM prompt with integrity rules
4. **Structured output**: GPT-4o-mini generates JSON with confidence, verdict, alignment, strengths, gaps, recommendations

---

## 🎨 User Interface

### Input Phase (LandingView)

- Two-field system for clarity (Problem & Solution)
- Character validation (200+ chars minimum)
- 8 adjustable parameter sliders with descriptions
- 12 pre-configured test cases
- Educational modals with comprehensive guidance

### Results Phase (ResultsView)

- Executive summary with overall score
- Interactive 8-dimensional radar chart
- Score breakdown for all 8 parameters
- Evidence cards with similarity metrics
- AI-generated insights and recommendations
- Methodology documentation

### Additional Views

- **HistoryView**: Manage assessment history with filtering/sorting
- **ComparisonView**: Side-by-side comparison of assessments
- **MarketAnalysisView**: Competitive benchmarking dashboard
- **EvaluationCriteriaView**: Methodology documentation

---

## 🚀 Deployment

### Environment Setup

Create `.env` in backend/:

```env
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

Create `.env` in frontend/:

```env
VITE_API_URL=https://your-api-domain.com
```

### Backend Deployment

The Express.js API can be deployed to:

- **Vercel**: `vercel deploy`
- **Railway**: Push to Railway with automatic detection
- **Heroku**: Standard Node.js buildpack
- **Docker**: Build and deploy container

### Frontend Deployment

The React app can be deployed to:

- **Vercel**: `vercel deploy`
- **Netlify**: Connect Git repository
- **GitHub Pages**: With SPA routing configured
- **Any static hosting**: Standard build with `npm run build`

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Dataset: [GreenTechGuardians](https://github.com/techandy42/GreenTechGuardians)
- Circular Economy Framework: Based on Ellen MacArthur Foundation principles
- AI Models: OpenAI GPT-4o-mini and text-embedding-3-small

---

## 📞 Support

For issues, questions, or suggestions:

- Open a GitHub issue
- Check the documentation in the docs/ folder
- Review test cases and examples

---

#### Built with ♻️ for a Sustainable Future

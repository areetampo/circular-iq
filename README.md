# 🌍 Circular Economy Business Auditor

**An AI-powered evaluation platform combining Retrieval-Augmented Generation (RAG) with deterministic scoring for reproducible, explainable circular economy assessments.**

---

## 📋 Project Overview

The Circular Economy Business Auditor is a full-stack web application that evaluates business ideas based on circular economy principles using a hybrid architecture:

- **Deterministic Scoring Engine**: Computes all numeric metrics using code-based algorithms
- **RAG-Powered Insights**: Leverages OpenAI embeddings and Supabase vector search for context-aware analysis
- **Evidence-Based Validation**: Cross-references user inputs against 1,108 curated circular economy projects

**Core Principle**: All numeric scores are calculated deterministically. The LLM only explains and contextualizes results—it never invents metrics.

### Current Features

✅ **Professional Assessment Tool** - No gamification, designed for consultants/investors
✅ **Two-Field Input System** - Separate Problem & Solution descriptions with semantic analysis
✅ **8-Factor Evaluation** - Weighted scoring across circular economy dimensions
✅ **Evidence-Based Analysis** - Every finding cites verified database projects
✅ **Gap Analysis & Benchmarking** - Real-time comparison vs. similar industry projects
✅ **Assessment History** - Save, filter, and manage evaluation records
✅ **Side-by-Side Comparison** - Compare 2 assessments with radar & bar charts
✅ **Market Analytics Dashboard** - Competitive benchmarking with scatter plots & trends
✅ **Multi-Page Routing** - React Router v7 with full browser history
✅ **Modern UI** - Tailwind CSS, custom scrollbars, professional modals
✅ **Full CRUD Operations** - Create, read, update, delete assessments

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- OpenAI API key

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
OPENAI_API_KEY=sk-your-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 2. Database Setup

Run the Supabase setup script in your SQL editor:

```bash
# Execute backend/supabase/setup.sql
# Creates: pgvector extension, documents table, RLS policies
```

Ingest the dataset:

```bash
node scripts/chunk.js
node scripts/embed_and_store.js
```

### 3. Start Backend API

```bash
npm start
# http://localhost:3001
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
```

### 5. Start Frontend

```bash
npm run dev
# http://localhost:5173
```

Navigate to http://localhost:5173 in your browser.

---

## 🧮 The 8-Factor Evaluation Methodology

Scoring evaluates business ideas across **three core value dimensions** and **eight specific factors**:

### 1️⃣ Access Value (30% of overall score)

| Factor                   | Description                             | Weight |
| ------------------------ | --------------------------------------- | ------ |
| **Public Participation** | How easily can stakeholders engage?     | 15%    |
| **Infrastructure**       | Is supporting infrastructure available? | 15%    |

### 2️⃣ Embedded Value (35% of overall score)

| Factor           | Description                             | Weight |
| ---------------- | --------------------------------------- | ------ |
| **Market Price** | Economic value and market demand        | 20%    |
| **Maintenance**  | Ease and cost of maintaining products   | 10%    |
| **Uniqueness**   | Rarity and reuse potential of materials | 5%     |

### 3️⃣ Processing Value (35% of overall score)

| Factor              | Description                                 | Weight |
| ------------------- | ------------------------------------------- | ------ |
| **Size Efficiency** | Physical dimensions and handling efficiency | 10%    |
| **Chemical Safety** | Environmental and health hazards            | 15%    |
| **Tech Readiness**  | Technology complexity and availability      | 10%    |

Each factor is scored 0-100. The overall circularity score is a weighted composite.

---

## 🏗️ Technical Stack

### Frontend

- **Framework**: React 18 + Vite 7
- **Routing**: React Router v7
- **Visualization**: Recharts (Radar, Bar, Scatter charts)
- **Styling**: Tailwind CSS v3
- **State Management**: React Hooks

### Backend

- **Runtime**: Node.js with Express.js
- **AI Integration**: OpenAI GPT-4o-mini + text-embedding-3-small
- **Vector Database**: Supabase (pgvector for semantic search)
- **Data Processing**: Custom chunking and embedding pipeline
- **Database**: PostgreSQL with Row-Level Security

### Dataset

- **Source**: [GreenTechGuardians AI_EarthHack Dataset](https://github.com/techandy42/GreenTechGuardians)
- **Size**: 1,300 records → 1,108 high-quality (after filtering)
- **Format**: CSV → Chunked JSON → Vector embeddings

---

## 📂 Project Structure

```
├── backend/
│   ├── api/
│   │   └── server.js              # Express API (port 3001)
│   ├── src/
│   │   ├── scoring.js             # Deterministic score calculation
│   │   └── ask.js                 # RAG-based AI reasoning
│   ├── scripts/
│   │   ├── chunk.js               # Dataset chunking
│   │   └── embed_and_store.js     # Embedding generation
│   ├── supabase/
│   │   └── setup.sql              # Database schema
│   ├── data/
│   │   └── test-cases.json        # 12 test scenarios
│   └── dataset/
│       └── GreenTechGuardians/
│           └── AI_EarthHack_Dataset.csv
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main component
│   │   ├── views/                 # Page components
│   │   │   ├── LandingView.jsx
│   │   │   ├── ResultsView.jsx
│   │   │   ├── HistoryView.jsx
│   │   │   └── ComparisonView.jsx
│   │   ├── components/            # Reusable components
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Helper functions
│   │   ├── index.css              # Global styles
│   │   └── App.css                # Component styles
│   └── vite.config.js
├── docs/
│   ├── DEVELOPMENT.md             # Development guide
│   ├── ARCHITECTURE.md            # System architecture
│   ├── API_DOCUMENTATION.md       # API endpoints
│   └── DATABASE_ARCHITECTURE.md   # Database schema
└── package.json                   # Root dependencies
```

---

## 🔄 System Architecture

```
User Input (React)
    ↓
API Server (Express)
    ├→ Deterministic Scoring (scoring.js)
    └→ RAG Pipeline (ask.js)
        ├→ OpenAI Embeddings
        ├→ Supabase Vector Search
        └→ GPT-4o-mini Reasoning
Results & Analytics
    ├→ Charts & Visualizations (Recharts)
    ├→ Assessment History (Database)
    └→ Comparisons & Benchmarking
```

---

## 📚 Documentation

- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Setup, troubleshooting, dev workflows
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and data flow
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - REST API endpoints
- **[DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md)** - Database schema

---

## 🛠️ Development

### Build Frontend

```bash
cd frontend
npm run build
```

### Run Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Troubleshooting

**Backend won't start?**

- Check `.env` variables are set correctly
- Verify Supabase URL and keys
- Ensure OpenAI API key has credits

**Frontend build fails?**

- Clear `node_modules` and reinstall: `npm ci`
- Check Node version (18+ required)
- Verify `VITE_API_URL` in `.env`

**No search results?**

- Confirm `embed_and_store.js` completed successfully
- Check Supabase pgvector extension is enabled
- Verify embeddings were stored in `documents` table

---

## 📄 License

Built with ♻️ for a Sustainable Future

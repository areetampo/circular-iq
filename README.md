# Circular Economy Business Idea Auditor

**An AI-powered evaluation platform combining Retrieval-Augmented Generation (RAG) with deterministic scoring for reproducible, explainable circular economy assessments.**

---

## 📋 Project Overview

The Circular Economy Business Auditor is a full-stack web application that evaluates business ideas based on circular economy principles. The system uses a hybrid architecture:

- **Deterministic Scoring Engine**: Computes all numeric metrics using code-based algorithms
- **RAG-Powered Insights**: Leverages OpenAI embeddings and Supabase vector search to provide context-aware qualitative analysis
- **Evidence-Based Validation**: Cross-references user inputs against a curated dataset of real circular economy projects

**Core Principle**: All numeric scores are calculated deterministically. The LLM only explains and contextualizes results—it never invents metrics.

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

## 🧮 The 8-Factor Evaluation Methodology

Our scoring framework evaluates business ideas across **three core value dimensions** and **eight specific factors**:

### 1️⃣ Access Value (Social & Logistical Accessibility)

| Factor                             | Description                                                                                               | Weight |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| **Public Participation**           | How easily stakeholders, communities, and end-users can engage with and contribute to the circular system | High   |
| **Infrastructure & Accessibility** | Availability of necessary infrastructure and ease of access to circular economy resources and processes   | High   |

### 2️⃣ Embedded Value (Economic & Material Worth)

| Factor           | Description                                                                             | Weight   |
| ---------------- | --------------------------------------------------------------------------------------- | -------- |
| **Market Price** | Economic value and market demand for recovered or repurposed materials                  | Critical |
| **Maintenance**  | Ease and cost of maintaining products, materials, or systems throughout their lifecycle | Medium   |
| **Uniqueness**   | Rarity, specialty, or distinctive value of materials and their potential for reuse      | Medium   |

### 3️⃣ Processing Value (Technical & Operational Feasibility)

| Factor              | Description                                                                                | Weight   |
| ------------------- | ------------------------------------------------------------------------------------------ | -------- |
| **Size Efficiency** | Physical dimensions and volume, affecting handling, storage, and transportation efficiency | Medium   |
| **Chemical Safety** | Potential environmental and health hazards, impacting safe processing and disposal methods | Critical |
| **Tech Readiness**  | Complexity and availability of technology required for effective processing and recovery   | High     |

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

1. **Describe Your Idea**: Enter a detailed description (minimum 50 characters) of your circular economy business concept

2. **Adjust Parameters** (Optional): Click "Advanced Parameters" to fine-tune the 8 evaluation factors using sliders

3. **View Results**: Receive:
   - Overall circularity score (0-100)
   - 8 sub-scores with descriptions
   - Radar chart comparing your idea vs. market average
   - AI-generated audit verdict
   - Strengths and gaps analysis
   - Actionable technical recommendations
   - Database evidence with semantic summaries

4. **Explore Evidence**: Click "View Full Context" on any database case to read the complete reference

### Features

- **📊 Multi-Dimensional Scoring**: Evaluate across Access, Embedded, and Processing value dimensions
- **🔍 Semantic Search**: Find similar projects from the research database
- **📈 Visual Analytics**: Radar chart for performance comparison
- **🤖 AI Explanations**: Context-aware reasoning for all scores
- **🎯 Integrity Checks**: Flags unrealistic claims based on database evidence
- **ℹ️ Interactive Help**: Info icons provide guidance on factors and inputs

---

## 📂 Project Structure

```
circular-economy-auditor/
├── backend/
│   ├── api/
│   │   └── server.js              # Express API server
│   ├── src/
│   │   ├── scoring.js             # Deterministic score calculation
│   │   └── ask.js                 # RAG-based AI reasoning
│   ├── scripts/
│   │   ├── chunk.js               # Dataset chunking
│   │   └── embed_and_store.js     # Embedding generation
│   ├── supabase/
│   │   └── setup.sql              # Database schema
│   ├── dataset/
│   │   └── GreenTechGuardians/    # CSV dataset
│   └── .env                       # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main React component
│   │   └── App.css                # Styling
│   └── package.json
└── README.md
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

1. **Embed user input**: `text-embedding-3-small` converts business description to 1536-dim vector
2. **Similarity search**: Supabase `match_documents()` finds top 3 most similar cases
3. **Context injection**: Retrieved cases are formatted into the LLM prompt
4. **Structured output**: GPT-4o-mini generates JSON with:
   - `confidence_score`: AI's confidence in the evaluation
   - `audit_verdict`: Overall assessment
   - `comparative_analysis`: How it compares to similar projects
   - `integrity_gaps`: Identified inconsistencies
   - `technical_recommendations`: Actionable improvements
   - `similar_cases_summaries`: One-sentence relevance explanations

---

## 🎨 UI Features

### Input Phase

- **Info Icons**: Contextual help for business description and evaluation factors
- **Parameter Sliders**: Grouped by value category (Access, Embedded, Processing)
- **Validation**: Minimum character requirements, junk input detection

### Results Phase

- **Score Cards**: Overall score + 8 sub-scores with progress bars
- **Radar Chart**: Multi-dimensional comparison (your idea vs. market)
- **Database Evidence**:
  - Match percentage (bold, emerald theme)
  - AI-generated semantic summary as card title
  - 4-line content preview with CSS clamping
  - "View Full Context" modal for complete text
- **Insights**: Strengths, gaps, and recommendations

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

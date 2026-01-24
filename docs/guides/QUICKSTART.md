# Quick Start Guide - Developer Setup

Get the Circular Economy Business Auditor running locally in 15 minutes.

---

## 📋 Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git**
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys))
- **Supabase Account** ([Free tier](https://supabase.com/))

---

## ⚡ 5-Minute Backend Setup

### 1. Clone & Install

```bash
git clone <your-repo>
cd circular-economy/backend
npm install
```

### 2. Create .env File

```bash
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-openai-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
EOF
```

### 3. Set Up Supabase

1. Create new project at [supabase.com](https://supabase.com/)
2. Go to SQL Editor
3. Run the contents of `supabase/setup.sql`
4. Copy your project URL and keys from Settings → API

### 4. Start Backend

```bash
npm start
# ✅ Server running on http://localhost:3001
# ✅ GET http://localhost:3001/health to verify
```

---

## ⚡ 5-Minute Frontend Setup

### 1. Install & Start

```bash
cd ../frontend
npm install
npm run dev
# ✅ Frontend running on http://localhost:5173
```

### 2. Configure API URL

The frontend automatically connects to `http://localhost:3001`. If using a different backend URL, create `.env.local`:

```bash
echo "REACT_APP_API_URL=http://localhost:3001" > .env.local
```

### 3. Open Browser

Navigate to [http://localhost:5173](http://localhost:5173)

---

## 🔄 Processing the Dataset (Optional for Development)

If you want to use real data from GreenTechGuardians:

### 1. Place CSV File

Ensure `backend/dataset/GreenTechGuardians/AI_EarthHack_Dataset.csv` exists

### 2. Generate Chunks

```bash
cd backend
npm run chunk
# Creates: chunks.json with semantic chunks
```

### 3. Generate Embeddings

```bash
npm run embed
# Processes chunks and stores in Supabase
# ⏱️ Takes 5-10 minutes depending on dataset size
```

---

## 🧪 Testing Your Setup

### 1. Test Backend Health

```bash
curl http://localhost:3001/health
# Expected response: { "status": "ok" }
```

### 2. Test API Endpoint

```bash
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{
    "businessProblem": "We need a solution for single-use plastic waste in urban areas",
    "businessSolution": "We collect and refurbish plastic packaging through a community network",
    "parameters": {
      "public_participation": 75,
      "infrastructure": 60,
      "market_price": 55,
      "maintenance": 70,
      "uniqueness": 65,
      "size_efficiency": 60,
      "chemical_safety": 80,
      "tech_readiness": 70
    }
  }'
```

### 3. Test Frontend

Open [http://localhost:5173](http://localhost:5173) and submit a test idea with parameters 50-70 range.

---

## 🛠️ Useful Commands

### Backend

```bash
npm start              # Run server
npm run dev            # Run with auto-reload
npm run chunk          # Process CSV into chunks
npm run embed          # Generate embeddings
npm run pipeline       # Full chunk + embed pipeline
```

### Frontend

```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview production build
npm run lint           # Run ESLint
```

---

## 🐛 Troubleshooting

### Backend won't start

**Error**: `Cannot find module '@supabase/supabase-js'`

**Solution**:

```bash
cd backend
npm install
```

**Error**: `OPENAI_API_KEY is not defined`

**Solution**: Verify `.env` file exists with correct key:

```bash
cat .env  # Should show OPENAI_API_KEY=sk-...
```

### Frontend can't connect to backend

**Error**: `Failed to fetch from http://localhost:3001`

**Solution**:

1. Verify backend is running: `curl http://localhost:3001/health`
2. Check CORS: Should see `CORS enabled` in backend logs
3. Verify API URL in frontend `.env.local`

### Supabase connection fails

**Error**: `Failed to connect to Supabase`

**Solution**:

1. Verify project is created at [supabase.com](https://supabase.com/)
2. Check `.env` has correct URL and keys
3. Run setup.sql in Supabase SQL Editor
4. Verify table created: `SELECT COUNT(*) FROM documents;`

### Embedding generation times out

**Error**: `Timeout after 30 seconds`

**Solution**: Large datasets take time. Run:

```bash
node scripts/embed_and_store.js  # Shows progress
```

---

## 📊 Project Structure (Quick Reference)

```
backend/
├── api/
│   └── server.js              # Express API server (start here)
├── src/
│   ├── scoring.js             # 8-factor scoring logic
│   └── ask.js                 # RAG reasoning system
├── scripts/
│   ├── chunk.js               # Dataset chunking
│   └── embed_and_store.js     # Embedding pipeline
├── supabase/
│   └── setup.sql              # Database schema
├── .env                       # Environment config (git ignored)
└── package.json

frontend/
├── src/
│   ├── App.jsx                # Main component
│   ├── App.css                # Styling
│   ├── constants/
│   │   └── evaluationData.js  # Parameter definitions
│   ├── utils/
│   │   └── helpers.js         # API calls, formatting
│   ├── components/            # UI components (6 files)
│   └── views/                 # Page views (3 files)
└── package.json
```

---

## 🎯 Next Steps After Setup

1. **Understand the 8-Factor Framework**
   - Read: `README.md` - "The 8-Factor Evaluation Methodology"
   - Interactive: Open frontend, click info icons

2. **Explore the Code**
   - Scoring: `backend/src/scoring.js` (400 lines, well-commented)
   - RAG: `backend/src/ask.js` (350 lines)
   - Constants: `frontend/src/constants/evaluationData.js` (400 lines)

3. **Build Frontend Components** (if not yet created)
   - See: `IMPLEMENTATION_GUIDE.md` for specifications
   - Components: ParameterSliders, RadarChart, EvidenceCard, etc.

4. **Deploy**
   - Backend: Railway, Render, or Heroku
   - Frontend: Vercel (recommended) or Netlify

---

## 📚 Documentation Files

| File                                               | Purpose                               |
| -------------------------------------------------- | ------------------------------------- |
| [README.md](README.md)                             | Full project overview, setup, usage   |
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Component specs, line counts, testing |
| [PROJECT_STATUS.md](PROJECT_STATUS.md)             | Completion status, timeline, roadmap  |
| [backend/src/scoring.js](backend/src/scoring.js)   | Scoring algorithm (with comments)     |
| [backend/src/ask.js](backend/src/ask.js)           | RAG system (with comments)            |

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `npm start` in backend runs without errors
- [ ] Backend responds to `curl http://localhost:3001/health`
- [ ] Frontend starts with `npm run dev`
- [ ] Can open [http://localhost:5173](http://localhost:5173)
- [ ] Can submit a test evaluation with parameters
- [ ] Receive back a score with details
- [ ] No console errors in browser or terminal

---

## 🤝 Getting Help

- **Backend Issues**: Check backend logs in terminal
- **Frontend Issues**: Check browser console (F12)
- **API Issues**: Test with curl command above
- **Database Issues**: Check Supabase SQL Editor
- **Documentation**: See README.md and IMPLEMENTATION_GUIDE.md

---

## 🚀 You're Ready!

Congratulations! Your Circular Economy Business Auditor is set up and running.

**Next**: Submit test evaluations and explore the interface!

---

**Built with ♻️ for a circular economy future**

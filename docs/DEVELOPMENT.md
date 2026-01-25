# Development Guide

Circular Economy Business Auditor - Complete development documentation.

---

## 🚀 Quick Start (15 minutes)

### Prerequisites

- Node.js 18+
- Git
- OpenAI API Key
- Supabase Account

### Backend Setup

```bash
cd backend
npm install

# Create .env
cat > .env << 'EOF'
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
NODE_ENV=development
EOF

# Set up Supabase via SQL Editor with supabase/setup.sql
npm start
# Server on http://localhost:3001
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App on http://localhost:5173
```

---

## 📁 Project Structure

```
circular-economy/
├── backend/
│   ├── api/server.js              # Express server
│   ├── data/test-cases.json       # Test case database
│   ├── dataset/GreenTechGuardians/ # Python ML modules
│   ├── scripts/                    # Embed & chunk scripts
│   └── supabase/setup.sql          # Database schema
├── frontend/
│   ├── src/
│   │   ├── views/                  # Page components
│   │   ├── components/             # Reusable UI components
│   │   ├── styles/                 # CSS modules
│   │   ├── hooks/                  # Custom React hooks
│   │   └── utils/                  # Helper functions
│   └── vite.config.js
└── docs/                           # Documentation
```

---

## 🎯 Key Features

### Core Assessment Engine

- **8 Evaluation Parameters**: public_participation, infrastructure, market_price, maintenance, uniqueness, size_efficiency, chemical_safety, tech_readiness
- **Deterministic Scoring**: All scores calculated via algorithms, not LLM
- **RAG-Powered Insights**: Semantic search against 1,108 circular economy projects
- **Evidence-Based Findings**: Every insight references database projects

### Frontend Architecture

- **React 18 + Vite**: Modern, fast development
- **React Router v7**: Full multi-page SPA with real URLs
- **Recharts**: Interactive data visualization
- **Tailwind CSS**: Responsive design with consistent styling
- **Custom Scrollbars**: Elegant thin scrollbars throughout

### Key Views

1. **LandingView** - Assessment input form
2. **ResultsView** - Detailed results with charts and analysis
3. **HistoryView** - Saved assessments portfolio
4. **ComparisonView** - Side-by-side comparison of 2 assessments
5. **MarketAnalysisView** - Competitive benchmarking
6. **EvaluationCriteriaView** - Criteria reference

### Backend Architecture

- **Express.js**: RESTful API
- **Supabase + PostgreSQL**: Vector database with pgvector
- **OpenAI Embeddings**: Semantic search
- **Python ML Modules**: Data extraction and analysis

---

## 🔧 Development Workflows

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Code Style & Linting

```bash
# Both directories have ESLint configured
npm run lint
npm run lint:fix
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build  # Outputs to dist/

# Backend
npm run build  # If applicable
```

---

## 🎨 Design System

### Color Palette

- **Primary**: Emerald (#34a83a) - Main actions, success states
- **Secondary**: Blue (#4a90e2) - Info, secondary actions
- **Accent**: Orange (#ff9800), Purple (#9c27b0), Teal (#26a69a)
- **Neutral**: Slate (100-800) - Text, backgrounds

### Component Patterns

- **Modals**: Custom overlay with backdrop blur, gradient headers
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Smooth transitions, scale on hover, proper disabled states
- **Tables**: Responsive with hover highlighting
- **Forms**: Full-width inputs, clear labels, validation feedback

### Tailwind Configuration

- Custom scrollbar styling in index.css
- Smooth animations (fade-in, zoom-in)
- Consistent spacing (4px grid)
- Shadow elevation system

---

## 📊 Database Schema

### Assessments Table

```sql
id, title, industry, overall_score, result_json, created_at, session_id
```

### Embeddings (Vector Search)

- Chunks from 1,108 circular economy projects
- OpenAI ada-002 embeddings
- Searchable via pgvector with similarity threshold

---

## 🚀 Deployment

### Backend

- Environment: Node.js runtime (Vercel, Railway, Heroku)
- Database: Supabase (managed PostgreSQL)
- APIs: OpenAI (production key)

### Frontend

- Build: `npm run build`
- Hosting: Vercel, Netlify, or static hosting
- Environment: `.env.production`

---

## 📝 Git Workflow

```bash
# Create feature branch
git checkout -b feature/description

# Make changes, test locally
npm run build
npm test

# Commit with semantic messages
git commit -m "feat: add new feature"
git commit -m "fix: resolve issue"
git commit -m "refactor: improve code"

# Push and create PR
git push origin feature/description

# After review, merge to main
# Optional: squash commits if PR has many commits
```

---

## 🐛 Common Issues & Fixes

### Port Already in Use

```bash
# Find and kill process on port 3001 or 5173
lsof -i :3001
kill -9 <PID>
```

### Supabase Connection Error

- Verify .env has correct SUPABASE_URL and SUPABASE_ANON_KEY
- Check project settings in Supabase dashboard
- Ensure setup.sql has been executed

### Hot Reload Not Working

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### OpenAI API Rate Limit

- Check API quota at platform.openai.com
- Ensure correct API key in .env
- Consider caching responses for common queries

---

## 📚 Additional Resources

- **React**: https://react.dev
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com
- **Vite**: https://vitejs.dev
- **Supabase**: https://supabase.com/docs
- **OpenAI**: https://platform.openai.com/docs

---

## 📞 Support

For issues or questions:

1. Check existing GitHub issues
2. Review documentation in `/docs`
3. Contact maintainers via GitHub

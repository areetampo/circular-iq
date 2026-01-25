# Developer Onboarding Checklist

For new developers joining the Circular Economy Business Auditor project

---

## 🎓 Learning Phase (2-3 hours)

### Understanding the Project (30 minutes)

- [ ] Read COMPLETION_SUMMARY.md
- [ ] Read README.md sections 1-3
- [ ] Review the 8-factor framework in README.md

### Understanding the Architecture (45 minutes)

- [ ] Read ARCHITECTURE.md - High-Level Data Flow
- [ ] Read ARCHITECTURE.md - Component Architecture
- [ ] Read ARCHITECTURE.md - Backend Services Architecture
- [ ] Study the diagram in README.md - System Architecture

### Understanding the API (45 minutes)

- [ ] Read API_DOCUMENTATION.md - Endpoints section
- [ ] Review example request/response in API_DOCUMENTATION.md
- [ ] Test with curl: `curl http://localhost:3001/health`
- [ ] Review error codes in API_DOCUMENTATION.md

### Understanding the Code (1 hour)

- [ ] Read backend/src/scoring.js (understand the algorithm)
- [ ] Read backend/src/ask.js (understand RAG flow)
- [ ] Read frontend/src/constants/evaluationData.js (understand data structure)
- [ ] Read frontend/src/utils/helpers.js (understand utilities)

---

## 🛠️ Setup Phase (30 minutes)

### Local Environment

- [ ] Clone repository
- [ ] Install Node.js 18+ (check: `node --version`)
- [ ] Install backend dependencies: `cd backend && npm install`
- [ ] Install frontend dependencies: `cd ../frontend && npm install`

### Configuration

- [ ] Create backend/.env from backend/.env.example
- [ ] Add OpenAI API key to .env
- [ ] Add Supabase credentials to .env
- [ ] Verify .env is in .gitignore (never commit!)
- [ ] If enabling API auth, set `API_AUTH_ENABLED=true` and `API_KEY=<secret>`; server will refuse to start in production without both. Missing Supabase vars will log warnings.

### Database Setup

- [ ] Create Supabase project
- [ ] Run backend/supabase/setup.sql in Supabase SQL editor
- [ ] Verify documents table exists: `SELECT COUNT(*) FROM documents;`
- [ ] Verify pgvector extension: `SELECT extname FROM pg_extension WHERE extname = 'vector';`

### Verification

- [ ] Start backend: `cd backend && npm start`
- [ ] Verify health: `curl http://localhost:3001/health`
- [ ] Start frontend: `cd ../frontend && npm run dev`
- [ ] Open [http://localhost:5173](http://localhost:5173) in browser
- [ ] Check browser console for errors (F12)

---

## 📚 Code Navigation (1 hour)

### Backend Code Structure

- [ ] Understand `backend/src/scoring.js` (400 lines)
  - [ ] Study calculateScores() function
  - [ ] Understand weight calculation
  - [ ] Review identifyIntegrityGaps() logic

- [ ] Understand `backend/src/ask.js` (350 lines)
  - [ ] Study system prompt (enforces evidence-based analysis)
  - [ ] Review user prompt template
  - [ ] Understand structured output format

- [ ] Understand `backend/api/server.js` (300 lines)
  - [ ] Review POST /score endpoint flow
  - [ ] Study input validation logic
  - [ ] Review error handling

### Frontend Code Structure

- [ ] Understand `frontend/src/constants/evaluationData.js` (400 lines)
  - [ ] Review parameterGuidance structure
  - [ ] Study calibration scales for 8 factors
  - [ ] Review color scheme

- [ ] Understand `frontend/src/utils/helpers.js` (350 lines)
  - [ ] Review submitForScoring() API wrapper
  - [ ] Study helpers for formatting and validation
  - [ ] Understand storage object for localStorage

### Database

- [ ] Review `backend/supabase/setup.sql` (300 lines)
  - [ ] Understand documents table schema
  - [ ] Review match_documents() function
  - [ ] Study indexes for performance

---

## 🔄 Development Workflow

### For Backend Development

#### Making Changes (Backend)

1. [ ] Create feature branch: `git checkout -b feature/your-feature`
2. [ ] Make changes in backend/ files
3. [ ] Test with: `npm start`
4. [ ] Verify with sample request:

   ```bash
   curl -X POST http://localhost:3001/score \
     -H "Content-Type: application/json" \
     -d '{"businessProblem": "...", "businessSolution": "...", "parameters": {...}}'
   ```

5. [ ] Check terminal for errors and logs
6. [ ] Commit: `git add . && git commit -m "Your message"`
7. [ ] Push: `git push origin feature/your-feature`

#### Testing Changes (Backend)

- [ ] No console errors in terminal
- [ ] GET /health returns 200 OK
- [ ] POST /score returns complete response
- [ ] All 8 factors present in response
- [ ] Confidence level calculated correctly
- [ ] Similar cases returned

### For Frontend Development

#### Making Changes (Frontend)

1. [ ] Create feature branch: `git checkout -b feature/your-feature`
2. [ ] Make changes in frontend/src/ files
3. [ ] Save file (auto-hot reload with Vite)
4. [ ] Check browser for visual changes
5. [ ] Check browser console (F12) for errors
6. [ ] Test component interactions
7. [ ] Commit: `git add . && git commit -m "Your message"`
8. [ ] Push: `git push origin feature/your-feature`

#### Testing Changes (Frontend)

- [ ] No red errors in browser console
- [ ] Visual changes appear correctly
- [ ] Component accepts props correctly
- [ ] State updates work as expected
- [ ] No layout shifts or flickering

---

## 🎯 Task-Specific Guides

### Building a Frontend Component

#### Step 1: Review Specification

- [ ] Read IMPLEMENTATION_GUIDE.md for your component
- [ ] Note the props required
- [ ] Note the features needed
- [ ] Note the estimated lines

#### Step 2: Setup

- [ ] Create file in frontend/src/components/YourComponent.jsx
- [ ] Import React and required libraries
- [ ] Import from evaluationData.js and helpers.js if needed
- [ ] Setup PropTypes validation

#### Step 3: Implement

- [ ] Create component function
- [ ] Add JSDoc comments
- [ ] Implement all features from spec
- [ ] Use emerald theme (#34a83a) for primary color
- [ ] Test with sample data

#### Step 4: Integrate

- [ ] Import in parent component
- [ ] Pass required props
- [ ] Test in context of other components
- [ ] Verify styling matches design

#### Step 5: Polish

- [ ] Add inline comments
- [ ] Remove console.logs
- [ ] Verify responsive design
- [ ] Check accessibility (tab navigation, colors)

### Building a Frontend View

#### Step 1: Understand Structure

- [ ] Which components does it use?
- [ ] What state does it manage?
- [ ] How does it call the API?
- [ ] Where does navigation go?

#### Step 2: Create Component

- [ ] Create file in frontend/src/views/YourView.jsx
- [ ] Create state variables
- [ ] Create event handlers
- [ ] Add JSDoc for entire component

#### Step 3: Add Components

- [ ] Import required components
- [ ] Add to JSX with correct props
- [ ] Connect to state/handlers
- [ ] Test each component works

#### Step 4: Add Navigation

- [ ] Create navigation buttons
- [ ] Link to other views
- [ ] Pass data between views if needed
- [ ] Test navigation flow

#### Step 5: Style & Polish

- [ ] Ensure responsive design
- [ ] Check emerald theme consistency
- [ ] Test on mobile/tablet/desktop
- [ ] Verify loading states

---

## 🧪 Testing Your Work

### Manual Testing Checklist

#### Backend Changes

- [ ] No console errors when starting
- [ ] All logs are appropriate level
- [ ] API responds to health check
- [ ] POST /score works with sample data
- [ ] Error handling shows correct messages
- [ ] Response times are reasonable (<3 seconds)

#### Frontend Changes

- [ ] No errors in browser console
- [ ] Component renders without errors
- [ ] Props pass correctly
- [ ] State updates work
- [ ] Click/interact events work
- [ ] Mobile responsive (use DevTools)
- [ ] Colors match emerald theme
- [ ] Hover states visible

#### Integration Testing

- [ ] Frontend → Backend communication works
- [ ] Can submit evaluation from frontend
- [ ] Results display correctly
- [ ] All data flows properly
- [ ] Error states handled gracefully

### Automated Testing Commands

```bash
# Backend
cd backend
npm start                              # Start server
curl http://localhost:3001/health      # Check health

# Frontend
cd frontend
npm run dev                            # Start dev server
npm run build                          # Production build
npm run lint                           # Check code style
```

---

## 📝 Code Standards

### JavaScript Standards

#### Naming Conventions

- [ ] Variables: camelCase (`businessProblem`)
- [ ] Functions: camelCase (`calculateScores()`)
- [ ] Components: PascalCase (`ParameterSliders`)
- [ ] Constants: UPPER_SNAKE_CASE (`MAX_LENGTH = 100`)

#### Documentation

- [ ] JSDoc comments for functions
- [ ] Inline comments for complex logic
- [ ] Props documented with types
- [ ] Return values documented

#### Code Style

- [ ] Use const/let (no var)
- [ ] Use arrow functions
- [ ] Use destructuring where possible
- [ ] Keep functions small (< 50 lines)
- [ ] Use meaningful variable names

### React Standards

#### Component Structure

- [ ] Props at top
- [ ] State below
- [ ] Event handlers below state
- [ ] Render JSX at bottom
- [ ] PropTypes at very bottom

#### Component Best Practices

- [ ] Use functional components
- [ ] Use hooks (useState, useEffect)
- [ ] Keep components focused (one responsibility)
- [ ] Pass data via props (not via window/global)
- [ ] Use callbacks for parent communication

---

## 🚀 Deployment Checklist

### Before Deploying Backend

- [ ] All tests pass
- [ ] No console errors
- [ ] API endpoints working
- [ ] Database queries optimized
- [ ] Error handling comprehensive
- [ ] Logging at appropriate levels
- [ ] Environment variables defined
- [ ] .env not in git repo
- [ ] Dependencies updated
- [ ] Node version compatible (18+)

### Before Deploying Frontend

- [ ] All tests pass
- [ ] No console errors
- [ ] Build succeeds: `npm run build`
- [ ] All components working
- [ ] Responsive design tested
- [ ] API URL configured
- [ ] No hardcoded localhost
- [ ] Environment variables configured
- [ ] Performance acceptable

### Deployment Commands

**Backend (Railway/Render)**:

```bash
git push origin main
# Platform automatically deploys
```

**Frontend (Vercel)**:

```bash
git push origin main
# Vercel automatically deploys
```

---

## 🐛 Debugging Guide

### Backend Debugging

#### Check Logs

```bash
# Terminal running npm start shows all logs
# Look for: errors, warnings, timing info
```

#### Test API Endpoint

```bash
curl -X POST http://localhost:3001/score \
  -H "Content-Type: application/json" \
  -d '{"businessProblem": "...", "businessSolution": "...", "parameters": {...}}'
```

#### Common Issues (Debugging)

| Error                       | Solution                                       |
| --------------------------- | ---------------------------------------------- |
| OPENAI_API_KEY not defined  | Check .env file exists                         |
| Cannot connect to Supabase  | Verify URL and keys in .env                    |
| Port 3001 already in use    | Kill process: `lsof -i :3001` \| `kill -9 PID` |
| Vector search returns empty | Check database has documents table             |

### Frontend Debugging

#### Browser DevTools (F12)

- [ ] Console tab - check for errors
- [ ] Network tab - verify API calls
- [ ] Elements tab - inspect components
- [ ] Source tab - set breakpoints

#### React DevTools

- [ ] Inspect component tree
- [ ] Check props values
- [ ] Monitor state changes
- [ ] Highlight re-renders

#### Common Issues

| Error                   | Solution                          |
| ----------------------- | --------------------------------- |
| CORS error              | Backend CORS not enabled          |
| Blank page              | Check browser console for errors  |
| API call fails          | Verify backend is running         |
| Component not rendering | Check props validation in console |

---

## 📚 Quick Reference

### Important Files

- **Scoring Logic**: backend/src/scoring.js
- **API Logic**: backend/api/server.js
- **RAG Logic**: backend/src/ask.js
- **Database Schema**: backend/supabase/setup.sql
- **Component Specs**: IMPLEMENTATION_GUIDE.md
- **API Docs**: API_DOCUMENTATION.md
- **Architecture**: ARCHITECTURE.md

### Key Concepts

- **8-Factor Scoring**: README.md - "The 8-Factor Evaluation Methodology"
- **Deterministic vs. Probabilistic**: All scores are deterministic (code-based)
- **RAG**: Retrieval-Augmented Generation (vector search + LLM)
- **Integrity Gaps**: Detected inconsistencies in factor scoring
- **Confidence Level**: AI's self-assessed reliability

### Important URLs

- API Health: `http://localhost:3001/health`
- Frontend: `http://localhost:5173`
- API Docs: `http://localhost:3001/docs/methodology`

---

## ✅ First Day Checklist

- [ ] Read COMPLETION_SUMMARY.md (30 min)
- [ ] Run through QUICKSTART.md setup (30 min)
- [ ] Read backend code files (1 hour)
- [ ] Read frontend constants/utils (1 hour)
- [ ] Test API with curl command (15 min)
- [ ] Test frontend loads (15 min)
- [ ] Ask questions about unclear parts (30 min)

**Total**: 4-5 hours to full productivity

---

## 🤝 Getting Help

### Documentation First

1. Check DOCUMENTATION_INDEX.md for relevant files
2. Read the specific documentation file
3. Check inline code comments
4. Search for related functions

### Then Ask

1. **Specific code question**: Share line number and code
2. **Architecture question**: Refer to ARCHITECTURE.md section
3. **API question**: Refer to API_DOCUMENTATION.md section
4. **Component question**: Refer to IMPLEMENTATION_GUIDE.md section

### Resources

- Inline code comments: Every major function documented
- Documentation index: DOCUMENTATION_INDEX.md
- Architecture diagrams: ARCHITECTURE.md
- Component specs: IMPLEMENTATION_GUIDE.md
- API examples: API_DOCUMENTATION.md

---

## 🎯 Success Metrics

### Code Quality

- [ ] No eslint errors
- [ ] No console.log() calls left
- [ ] Meaningful variable/function names
- [ ] Proper error handling
- [ ] Comments for complex logic

### Functionality

- [ ] Feature works as specified
- [ ] No regression bugs
- [ ] Error cases handled
- [ ] Edge cases considered
- [ ] Performance acceptable

### Integration

- [ ] Works with existing code
- [ ] Props/data types match
- [ ] No breaking changes
- [ ] Tests pass
- [ ] Deployment successful

---

### Welcome to the team! 🚀

Start with: QUICKSTART.md → README.md → IMPLEMENTATION_GUIDE.md

Questions? Check the relevant documentation file first!

---

Built with ♻️ for a circular economy future

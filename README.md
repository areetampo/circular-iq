# Circular Economy Evaluator

A comprehensive AI-powered platform for evaluating circular economy initiatives against real-world benchmarks using semantic search and evidence-based scoring.

## Overview

This project consists of a full-stack application that helps businesses assess their circular economy initiatives by:

- **Evaluating** initiatives through guided questionnaires
- **Scoring** across 8 key dimensions (Materials, Design, Manufacturing, etc.)
- **Comparing** against similar real-world projects from a curated dataset
- **Providing** AI-generated recommendations and gap analysis
- **Generating** exportable reports and shareable results

## Architecture

### Backend (Node.js/Express)

- **Data Pipeline**: Processes 34+ datasets into vector embeddings
- **Vector Search**: Hybrid search using OpenAI embeddings + BM25
- **APIs**: REST endpoints for scoring, analytics, and assessments
- **Database**: Supabase PostgreSQL with pgvector extension

### Frontend (React/Vite)

- **UI Framework**: HeroUI v3 (Beta) components
- **Charts**: MUI X Charts for data visualization
- **State Management**: React Query + custom hooks
- **Routing**: React Router with session persistence

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)
- OpenAI API key (for embeddings)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd circular-economy-evaluator
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Environment Setup**
   - Copy `env/backend.env.example` to `env/backend.env`
   - Copy `env/frontend.env.example` to `env/frontend.env`
   - Fill in your API keys and database credentials

4. **Database Setup**

   ```bash
   cd backend
   npm run db:migrate
   npm run pipeline:run
   ```

5. **Start Development Servers**

   ```bash
   # Backend (from project root)
   npm run dev:backend

   # Frontend (from project root)
   npm run dev:frontend
   ```

## Key Features

### Assessment Engine

- 8-dimensional scoring system
- AI-powered evidence matching
- Real-time gap analysis
- Benchmark comparisons

### Data Pipeline

- Automated dataset ingestion
- Semantic chunking and embedding
- Vector similarity search
- Hybrid search algorithms

### User Experience

- Guided assessment flow
- Interactive results visualization
- PDF/CSV export capabilities
- Public result sharing

## Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── controllers/         # Route handlers
│   ├── services/           # Business logic
│   ├── database/           # DB schema and migrations
│   ├── pipeline/           # Data processing scripts
│   └── tests/              # Backend tests
├── frontend/               # React/Vite application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── features/      # Feature-specific logic
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
└── env/                   # Environment configuration
```

## API Documentation

### Core Endpoints

- `POST /api/scoring/score` - Score assessment and find similar cases
- `GET /api/analytics/documents-summary` - Dataset statistics
- `POST /api/search` - Semantic search across documents
- `GET /api/assessments` - User assessment management

### Authentication

The application supports both authenticated and anonymous usage:

- Anonymous users get 5 free assessments
- Authenticated users have unlimited access
- Session data persists across page reloads

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

### Deployment

The application is designed for Vercel deployment:

- Backend APIs deploy as serverless functions
- Frontend builds to static assets
- Database remains on Supabase

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting PRs

## License

This project is proprietary software. See LICENSE file for details.

## Support

For technical support or questions:

- Review backend and frontend READMEs for specific guidance
- Open an issue for bugs or feature requests

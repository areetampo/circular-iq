# Database Architecture Diagram

## Current State (After Reorganization)

```
┌─────────────────────────────────────────────────────────────┐
│                 Your Circular Economy App                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React)          Backend (Node.js)   Database      │
│  ┌──────────────┐         ┌─────────────────┐  (Supabase)   │
│  │   Landing    │         │ /score endpoint │      ▼        │
│  │   Results    │◄──────►│                 │  ┌────────┐   │
│  │   History    │         │ /assessments    │  │ setup  │   │
│  │   Compare    │         │   endpoints     │  │ Phase1 │   │
│  │   Market     │         │                 │  └────────┘   │
│  │   Analysis   │         │ RPC functions   │      ▼        │
│  └──────────────┘         └─────────────────┘  ┌────────┐   │
│                                                │ migr.  │   │
│                                                │ Phase2 │   │
│                                                └────────┘   │
│                                                     ▼       │
│                                                ┌────────┐   │
│                                                │ migr.  │   │
│                                                │ Phase3 │   │
│                                                │(future)│   │
│                                                └────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Migration Flow

```
                 Your Supabase Project
                        │
                        ▼
        ┌───────────────────────────────┐
        │      setup.sql (Phase 1)      │ ← Run Once
        │  275 lines                    │
        ├───────────────────────────────┤
        │ • pgvector extension          │
        │ • documents table             │
        │ • Search functions            │
        │ • Analytical functions        │
        │ • RLS policies                │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Chunking Pipeline Runs      │
        │  (embed_and_store.js)         │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    migrations/001_*.sql       │ ← Run Once (After Phase 1)
        │  (Phase 2 - 113 lines)        │
        ├───────────────────────────────┤
        │ • assessments table           │
        │ • Analytics functions         │
        │ • RLS policies                │
        │ • Indexes for performance     │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    migrations/002_*.sql       │ ← Run Once (Phase 3)
        │  (Future features)            │
        ├───────────────────────────────┤
        │ • [Your Phase 3 schema]       │
        │ • [Your Phase 3 functions]    │
        └───────────────────────────────┘

        Legend:
        ═════════════════════════════════
        Phase 1: Foundation (Documents + Search)
        Phase 2: Assessment System (Portfolio + Analytics)
        Phase 3+: New features (Add as migrations)
```

---

## File Organization

```
backend/supabase/
│
├── setup.sql  (275 lines) ────────┐
│  ├─ Extensions (pgvector, etc.)  │
│  ├─ documents table              │ Phase 1
│  ├─ Search functions             │
│  ├─ Analytical functions         │
│  └─ RLS policies                 │
│                                  │
├── migrations/                    │
│  │                               │
│  └── 001_assessments_system.sql  ├─ All sequential
│      (113 lines)                 │
│      ├─ assessments table        │ Phase 2
│      ├─ Analytics functions      │
│      ├─ RLS policies             │
│      └─ Indexes                  │
│                                  │
├── README.md ─────────────────────┤ Documentation
│  ├─ Setup instructions           │
│  ├─ Migration guide              │
│  ├─ Data safety notes            │
│  └─ Troubleshooting              │
│                                  │
└── [Migrations added here later]  └─ Future phases
   002_user_auth.sql
   003_advanced_analytics.sql
   ...
```

---

## Data Flow

### Phase 1: Documents & Search

```
CSV Data
   ↓
chunk.js  ──→  Chunks  ──┐
   ↓              ↓      │
embed_and_store.js        │ Stored in:
   ↓              ↓      │
Embeddings  ──→ Vectors ─┤
   ↓                     │
                   documents table
                         │
                         ▼
           (Searchable by: match_documents,
            search_by_industry, search_hybrid)
```

### Phase 2: Assessment Tracking

```
User Assessment
   ↓
/score endpoint  ──→  Result JSON
   ↓                    ↓
ResultsView            │
   ├─ Display result   │
   └─ Save button  ────┤
       ↓               │ Stored in:
   POST /assessments   │
       ↓               ▼
   assessments table
       │
       ├─→ HistoryView (list saved assessments)
       ├─→ ComparisonView (compare 2 assessments)
       └─→ MarketAnalysisView (market positioning)
           via: get_assessment_statistics()
                get_market_data()
```

---

## Key Concepts

### Safe to Re-run

```
IF NOT EXISTS  ──→  Table won't be recreated
DROP IF EXISTS ──→  Old versions cleaned up properly

Result: ✅ Safe to run multiple times
        ✅ Won't lose data
        ✅ Won't cause conflicts
```

### Migration Philosophy

```
Phase 1 (setup.sql)           Phase 2 (001_migration.sql)
├─ Core infrastructure        ├─ New features
├─ Run: ONCE                  ├─ Run: ONCE (after Phase 1)
├─ Persistent data            ├─ Additive changes
└─ Foundation                 └─ Builds on Phase 1

Extending to Phase 3+:
├─ Create 002_migration.sql
├─ Run: ONCE (after Phase 2)
└─ Each migration is independent
```

---

## Size Comparison

```
Before Reorganization:
┌─────────────────────────────────────────────┐
│         setup.sql (417 lines)               │
│  ├─ Phase 1 stuff (312 lines)               │
│  ├─ Phase 2 stuff (105 lines)               │
│  └─ Mixed together (confusing!)             │
└─────────────────────────────────────────────┘

After Reorganization:
┌──────────────────────┐
│ setup.sql (275)      │ Phase 1 ✓
├──────────────────────┤
│ migrations/001 (113) │ Phase 2 ✓
└──────────────────────┘
   Cleaner? ✅
   Clearer? ✅
   Modular? ✅
```

---

## Execution Timeline

```
Day 1: Initial Setup
├─ Deploy setup.sql (Phase 1)
├─ Run embedding pipeline
└─ ✅ System live with search features

Day N: Phase 2 Features Ready
├─ Deploy migrations/001_assessments_system.sql
├─ Test Phase 2 features
└─ ✅ Assessment tracking + market analysis live

Day N+M: Phase 3 Ready
├─ Create migrations/002_*.sql
├─ Deploy it
└─ ✅ New features live

Pattern continues:
├─ Each phase is isolated
├─ Each migration runs once
├─ No data loss between phases
└─ Easy to rollback if needed
```

---

## Reference: SQL File Headers

### setup.sql Header

```
/**
 * Supabase Schema Setup - Phase 1 (Initial Setup)
 *
 * This file sets up the base infrastructure for the
 * Circular Economy Business Auditor.
 *
 * RUN THIS ONCE during initial deployment.
 */
```

### 001_assessments_system.sql Header

```
/**
 * Supabase Migration: Assessment System (Phase 2)
 *
 * Adds assessment portfolio tracking and market analysis.
 *
 * Run this migration AFTER setup.sql is executed.
 */
```

---

## Success Indicators

After running each phase, verify:

```
Phase 1 Complete:
┌─────────────────────────────────┐
│ ✅ documents table exists       │
│ ✅ Indexes created              │
│ ✅ Functions callable           │
│ ✅ RLS policies active          │
│ ✅ Chunking pipeline runs       │
└─────────────────────────────────┘

Phase 2 Complete:
┌─────────────────────────────────┐
│ ✅ assessments table exists     │
│ ✅ Analytics functions work     │
│ ✅ RLS policies protect data    │
│ ✅ Frontend can save/compare    │
│ ✅ Market analysis displays     │
└─────────────────────────────────┘
```

---

**Created**: January 23, 2026
**Architecture**: Modular Migration System
**Status**: Production Ready ✅

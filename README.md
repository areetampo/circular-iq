# Circular Economy Business Idea Scorer

RAG + Deterministic Scoring Architecture

This project implements a Circular Economy (CE) evaluation system that combines deterministic scoring with Retrieval-Augmented Generation (RAG) to produce reproducible, explainable, and grounded evaluations of business ideas.

Rule:
All numeric scores are computed by code. The LLM only explains the results.

## HIGH-LEVEL ARCHITECTURE

Dataset → Chunking → Embeddings → Vector DB (Supabase)
↓
Frontend → Backend API → Scoring Logic → RAG Search → LLM Explanation

## DATASET

Source:
https://github.com/techandy42/GreenTechGuardians

Local placement:
backend/dataset/GreenTechGuardians/
└── AI_EarthHack_Dataset.csv

The dataset is ingested once and never queried directly at runtime.

## DATASET INGESTION PIPELINE (ONE-TIME)

### STEP 1: CHUNKING

Purpose:
Large documents are split into small semantic chunks to improve embedding quality and retrieval accuracy.

Script:
backend/scripts/chunk.js

Command:
node scripts/chunk.js

Output:
Structured JSON chunks with source metadata.

### STEP 2: EMBEDDING AND STORAGE

Purpose:
Convert each chunk into a vector embedding and store it in Supabase (pgvector).

Script:
backend/scripts/embed_and_store.js

Command:
node scripts/embed_and_store.js

This step runs once unless the dataset changes.

## SUPABASE VECTOR DATABASE SETUP

create table + similarity search function: backend/supabase/setup.sql

## DETERMINISTIC SCORING LOGIC

File:
backend/src/scoring.js

Responsibilities:

- Compute all numeric Circular Economy metrics
- Ensure reproducibility and mathematical correctness

Inputs:

- Recyclability
- Energy efficiency
- Product lifespan
- Reuse cycles

Outputs:

- Overall CE score
- Sub-scores

No AI involvement.

## RAG-BASED EXPLANATION

File:
backend/src/ask.js

Process:

1. Embed user business idea
2. Retrieve top-K relevant dataset chunks from Supabase
3. Inject retrieved context and computed scores into the LLM prompt
4. Generate qualitative explanation

The LLM:

- Does NOT calculate numbers
- Does NOT invent metrics
- Only explains strengths and weaknesses

## API SERVER

File:
backend/api/server.js

Endpoint:
POST /score

Example request:
{
"idea": "Modular housing using recycled steel and solar energy",
"parameters": {
"recyclability": 85,
"energy_efficiency": 70,
"reuse_cycles": 6,
"lifespan_years": 40
}
}

Example response:
{
"overall_score": 0.27,
"sub_scores": {
"public_participation": 0.3,
"infrastructure_and_accessibility": 0.24
},
"reasoning": "The proposed modular housing aligns well with circular construction principles..."
}

## FRONTEND

Built using React + Vite.

Responsibilities:

- Collect business idea text
- Collect numeric CE parameters
- Send POST request to backend
- Display scores and explanations

## RUNNING THE PROJECT

Backend:
cd backend
npm install
node api/server.js
Runs on http://localhost:3001

Frontend:
cd frontend
npm install
npm run dev
Runs on http://localhost:5173

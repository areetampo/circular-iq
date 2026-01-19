import dotenv from 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js'; // Added
import OpenAI from 'openai'; // Added

import { calculateScores } from '../src/scoring.js';
import { generateReasoning } from '../src/ask.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase & OpenAI
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/score', async (req, res) => {
  try {
    const { idea, parameters } = req.body;

    // 1. INPUT VALIDATION
    if (!idea || idea.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide a detailed business description.' });
    }

    const isJunk = /^(.)\1*$/.test(idea.trim()) || idea.trim().length < 5;
    if (isJunk) {
      return res.status(400).json({ error: 'Invalid description. Use real words.' });
    }

    // 2. VECTOR SEARCH (RAG Step)
    // Convert the user's idea into a math vector
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: idea,
    });
    const queryVector = embeddingRes.data[0].embedding;

    // Query Supabase using the match_documents function you created
    const { data: similarDocs, error: searchError } = await supabase.rpc('match_documents', {
      query_embedding: queryVector,
      match_count: 3,
    });

    if (searchError) {
      console.error('Supabase Error:', searchError);
    }

    // 3. CALCULATE SCORES
    const scores = calculateScores(parameters);

    // 4. VALIDATE AND FILTER sub_scores to ensure only the 8 correct keys
    const validKeys = [
      'public_participation',
      'infrastructure',
      'market_price',
      'maintenance',
      'uniqueness',
      'size_efficiency',
      'chemical_safety',
      'tech_readiness',
    ];

    // Filter sub_scores to only include valid keys
    const filteredSubScores = {};
    validKeys.forEach((key) => {
      if (scores.sub_scores && key in scores.sub_scores) {
        filteredSubScores[key] = scores.sub_scores[key];
      }
    });

    // 5. GENERATE REASONING (Pass similarDocs as context)
    // Pass the filtered scores to ensure consistency
    const auditResult = await generateReasoning(idea, { ...scores, sub_scores: filteredSubScores }, parameters, similarDocs || []);

    // 6. SEND RESPONSE - Only include the 8 valid keys
    const response = {
      overall_score: scores.overall_score || 0,
      sub_scores: filteredSubScores,
      audit: auditResult,
      similar_cases: similarDocs || [], // Sending this so frontend can show "Related Projects"
    };

    // Log for debugging - verify no old keys are present
    console.log('API Response - sub_scores keys:', Object.keys(filteredSubScores));
    console.log('API Response - sub_scores:', filteredSubScores);

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});

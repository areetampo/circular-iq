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
    const { businessProblem, businessSolution, parameters } = req.body;

    // 1. INPUT VALIDATION
    if (!businessProblem || businessProblem.trim().length < 200) {
      return res.status(400).json({ 
        error: 'Business problem must be at least 200 characters. Please provide detailed context about the environmental or circular economy challenge.' 
      });
    }

    if (!businessSolution || businessSolution.trim().length < 200) {
      return res.status(400).json({ 
        error: 'Business solution must be at least 200 characters. Please describe your approach, materials, and circularity strategy in detail.' 
      });
    }

    // Check for junk input
    const isJunkProblem = /^(.)\1*$/.test(businessProblem.trim());
    const isJunkSolution = /^(.)\1*$/.test(businessSolution.trim());
    if (isJunkProblem || isJunkSolution) {
      return res.status(400).json({ error: 'Invalid description. Use real words to describe your business.' });
    }

    // Validate parameters object exists
    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({ error: 'Missing required parameters for evaluation.' });
    }

    // 2. VECTOR SEARCH (RAG Step)
    // Combine problem and solution for embedding
    const combinedText = `Problem: ${businessProblem}. Solution: ${businessSolution}`;
    
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: combinedText,
    });
    const queryVector = embeddingRes.data[0].embedding;

    // Query Supabase using the match_documents function
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

    // 5. GENERATE REASONING (Pass separate problem/solution with context)
    const auditResult = await generateReasoning(
      businessProblem, 
      businessSolution, 
      { ...scores, sub_scores: filteredSubScores }, 
      parameters, 
      similarDocs || []
    );

    // 6. SEND RESPONSE - Include metadata from similar_cases
    const response = {
      overall_score: scores.overall_score || 0,
      sub_scores: filteredSubScores,
      audit: auditResult,
      similar_cases: (similarDocs || []).map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata || {},
        similarity: doc.similarity
      })),
    };

    // Log for debugging
    console.log('API Response - sub_scores keys:', Object.keys(filteredSubScores));
    console.log('Similar cases count:', response.similar_cases.length);

    res.json(response);
  } catch (err) {
    console.error('Server Error:', err);
    
    // Enhanced error handling for specific cases
    if (err.message && err.message.includes('OpenAI')) {
      return res.status(500).json({ 
        error: 'AI service temporarily unavailable. Please try again.' 
      });
    }
    
    if (err.message && err.message.includes('Supabase')) {
      return res.status(500).json({ 
        error: 'Database service temporarily unavailable. Please try again.' 
      });
    }
    
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});

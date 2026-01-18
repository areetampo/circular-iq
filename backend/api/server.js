import dotenv from 'dotenv/config'
import express from 'express'
import cors from 'cors'

import { calculateScores } from '../src/scoring.js'
import { generateReasoning } from '../src/ask.js'

const app = express()
app.use(cors())
app.use(express.json())

app.post('/score', async (req, res) => {
  try {
    const { idea, parameters } = req.body

    if (!idea || !parameters) {
      return res.status(400).json({ error: 'Missing idea or parameters' })
    }

    const { recyclability, energy_efficiency, reuse_cycles, lifespan_years } =
      parameters

    const scores = calculateScores({
      recyclability,
      energy_efficiency,
      reuse_cycles,
      lifespan_years
    })

    const reasoning = await generateReasoning(idea, scores, parameters)

    res.json({
      overall_score: scores.overall_score,
      sub_scores: scores.sub_scores,
      reasoning
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.listen(3001, () => {
  console.log('API running on http://localhost:3001')
})

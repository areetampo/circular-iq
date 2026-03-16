import express from 'express';

import { searchDocuments } from '#controllers/search.controller.js';

export default function createSearchRouter(openai) {
  const router = express.Router();
  router.post('/', searchDocuments(openai));
  return router;
}

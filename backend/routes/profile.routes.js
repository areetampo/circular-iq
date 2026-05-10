import express from 'express';

import { requireAuth } from '#middleware/auth.middleware.js';

export default function createProfileRouter(serviceSupabase) {
  const router = express.Router();

  router.get('/', requireAuth(serviceSupabase), async (req, res) => {
    try {
      const { data, error } = await serviceSupabase
        .from('profiles')
        .select('id, username, created_at, updated_at')
        .eq('id', req.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Profile not found',
            code: 'PROFILE_NOT_FOUND',
            timestamp: new Date().toISOString(),
          });
        }
        throw error;
      }

      res.json({
        id: data.id,
        username: data.username,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (err) {
      logger.error({ err }, 'Failed to fetch profile');
      res.status(500).json({
        error: 'Failed to fetch profile',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}

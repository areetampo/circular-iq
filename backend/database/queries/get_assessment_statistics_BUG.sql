DISCARD PLANS;

CREATE OR REPLACE FUNCTION get_assessment_statistics(user_uuid UUID DEFAULT NULL)
RETURNS TABLE (
  total_assessments             BIGINT,
  completed_assessments         BIGINT,
  avg_score                     FLOAT,
  median_score                  FLOAT,
  min_score                     INTEGER,
  max_score                     INTEGER,
  avg_confidence                FLOAT,
  avg_technical_feasibility     FLOAT,
  avg_economic_viability        FLOAT,
  avg_circularity_potential     FLOAT,
  avg_param_consistency_score   FLOAT,
  avg_r_alignment_score         FLOAT,
  assessments_by_industry       JSONB,
  assessments_by_risk           JSONB,
  assessments_by_scale          JSONB,
  assessments_by_tier           JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    -- FIXED: Changed 'assessments' to 'user_assessments'
    SELECT a.*
    FROM user_assessments a
    WHERE (user_uuid IS NULL OR a.user_id = user_uuid)
      AND a.overall_score IS NOT NULL
  ),
  stats AS (
    SELECT
      COUNT(*)::BIGINT                                          AS total,
      COUNT(*) FILTER (WHERE overall_score IS NOT NULL)::BIGINT AS completed,
      AVG(overall_score::FLOAT)                                AS avg_sc,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY overall_score) AS median_sc,
      MIN(overall_score)                                       AS min_sc,
      MAX(overall_score)                                       AS max_sc,
      AVG(confidence_level::FLOAT)                             AS avg_conf,
      AVG(technical_feasibility::FLOAT)                        AS avg_tf,
      AVG(economic_viability::FLOAT)                           AS avg_ev,
      AVG(circularity_potential::FLOAT)                        AS avg_cp,
      AVG(parameter_consistency_score::FLOAT)                  AS avg_pcs,
      AVG(r_strategy_alignment_score::FLOAT)                   AS avg_ras
    FROM base
  ),
  by_industry AS (
    SELECT jsonb_object_agg(
      COALESCE(industry, 'uncategorized'),
      jsonb_build_object('count', cnt, 'avg_score', ind_avg)
    ) AS ind_stats
    FROM (
      SELECT industry, COUNT(*)::INT AS cnt, ROUND(AVG(overall_score)::NUMERIC, 1) AS ind_avg
      FROM base GROUP BY industry
    ) sub
  ),
  by_risk AS (
    SELECT jsonb_object_agg(COALESCE(risk_level,'unknown'), cnt) AS risk_stats
    FROM (SELECT risk_level, COUNT(*)::INT AS cnt FROM base GROUP BY risk_level) sub
  ),
  by_scale AS (
    SELECT jsonb_object_agg(COALESCE(scale,'unknown'), cnt) AS scale_stats
    FROM (SELECT scale, COUNT(*)::INT AS cnt FROM base GROUP BY scale) sub
  ),
  by_tier AS (
    SELECT jsonb_object_agg(
      COALESCE(tier_name, 'unknown'), cnt
    ) AS tier_stats
    FROM (
      SELECT circular_economy_tier->>'tier' AS tier_name, COUNT(*)::INT AS cnt
      FROM base WHERE circular_economy_tier IS NOT NULL GROUP BY tier_name
    ) sub
  )
  SELECT
    s.total, s.completed, s.avg_sc, s.median_sc, s.min_sc, s.max_sc,
    s.avg_conf, s.avg_tf, s.avg_ev, s.avg_cp, s.avg_pcs, s.avg_ras,
    COALESCE(bi.ind_stats,   '{}'::jsonb),
    COALESCE(br.risk_stats,  '{}'::jsonb),
    COALESCE(bs.scale_stats, '{}'::jsonb),
    COALESCE(bt.tier_stats,  '{}'::jsonb)
  FROM stats s
  CROSS JOIN by_industry bi
  CROSS JOIN by_risk     br
  CROSS JOIN by_scale    bs
  CROSS JOIN by_tier     bt;
END;
$$ LANGUAGE plpgsql SET search_path = public, extensions STABLE;

COMMENT ON FUNCTION get_assessment_statistics IS
  'Aggregated statistics for all (or one user''s) assessments using promoted scalar columns';

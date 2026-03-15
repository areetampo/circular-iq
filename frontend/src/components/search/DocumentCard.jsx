import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Chip, Typography, Box } from '@mui/material';

export default function DocumentCard({ document }) {
  const {
    content,
    industry,
    category,
    source,
    similarity,
    metadata = {},
  } = document || {};

  const snippet = content
    ? String(content).slice(0, 200)
    : String(metadata?.fields?.problem || '').slice(0, 200);

  const similarityPct = typeof similarity === 'number' ? Math.round(similarity * 100) : null;

  return (
    <Card variant="outlined" sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, whiteSpace: 'pre-wrap' }}>
          {snippet}
          {snippet && snippet.length >= 200 ? '…' : ''}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {industry && <Chip label={industry} size="small" />}
          {category && <Chip label={category} size="small" />}
          {source && <Chip label={source} size="small" />}
          {metadata?.r_strategy && (
            <Chip label={metadata.r_strategy} size="small" color="secondary" />
          )}
          {similarityPct != null && (
            <Chip label={`${similarityPct}% similar`} size="small" />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

DocumentCard.propTypes = {
  document: PropTypes.shape({
    content: PropTypes.string,
    industry: PropTypes.string,
    category: PropTypes.string,
    source: PropTypes.string,
    similarity: PropTypes.number,
    metadata: PropTypes.object,
  }).isRequired,
};

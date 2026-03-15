import React from 'react';
import PropTypes from 'prop-types';
import { Card, Chip } from '@heroui/react';

export default function DocumentCard({ document }) {
  const { content, industry, category, source, similarity, metadata = {} } = document || {};

  const snippet = content
    ? String(content).slice(0, 200)
    : String(metadata?.fields?.problem || '').slice(0, 200);

  const similarityPct = typeof similarity === 'number' ? Math.round(similarity * 100) : null;

  return (
    <Card className="w-full h-full flex flex-col">
      <Card.Content className="flex-1 flex flex-col gap-1">
        <p className="text-sm text-default-600 flex-1 whitespace-pre-wrap">
          {snippet}
          {snippet && snippet.length >= 200 ? '…' : ''}
        </p>

        <div className="flex flex-wrap gap-1 mt-1">
          {industry && <Chip size="sm">{industry}</Chip>}
          {category && <Chip size="sm">{category}</Chip>}
          {source && <Chip size="sm">{source}</Chip>}
          {metadata?.r_strategy && (
            <Chip size="sm" color="secondary">
              {metadata.r_strategy}
            </Chip>
          )}
          {similarityPct != null && <Chip size="sm">{`${similarityPct}% similar`}</Chip>}
        </div>
      </Card.Content>
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

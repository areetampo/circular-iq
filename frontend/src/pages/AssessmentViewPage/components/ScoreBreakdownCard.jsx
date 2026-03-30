import { Card } from '@heroui/react';

import { Chip } from '@/components/common';

export default function ScoreBreakdownCard({ scoringResult }) {
  if (!scoringResult?.score_breakdown) return null;

  return (
    <Card
      className="border rounded-xl card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-4">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--foreground)' }}>
          Score Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(scoringResult.score_breakdown).map(([category, data]) => (
            <div
              key={category}
              className="p-4 border rounded-lg"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  {category}
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                  {data.score}
                </div>
              </div>
              <div className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                {data.weight}
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                {data.description}
              </p>
              <div className="flex flex-wrap gap-1">
                {data.factors?.map((factor, i) => (
                  <Chip key={i} variant="default" className="text-xs">
                    {factor.name}: {factor.score}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

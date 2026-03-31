import { GapAnalysisCard as SharedGapAnalysisCard } from '@/components/results/shared';

export default function GapAnalysisCard({ scoringResult }) {
  return <SharedGapAnalysisCard result={scoringResult} variant="assessment" />;
}

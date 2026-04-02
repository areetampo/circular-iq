import { NotebookPen, PencilRuler } from 'lucide-react';

import { Button } from '@/components/common';

export default function MethodologyButtons({
  openAssessmentMethodologyDrawer,
  openEvaluationCriteriaDrawer,
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button onPress={openAssessmentMethodologyDrawer} size="sm" variant="secondary">
        <PencilRuler size={14} />
        <span>Assessment Methodology</span>
      </Button>
      <Button onPress={openEvaluationCriteriaDrawer} size="sm" variant="secondary">
        <NotebookPen size={14} />
        <span>Evaluation Criteria</span>
      </Button>
    </div>
  );
}

import { motion } from 'framer-motion';
import { NotebookPen, PencilRuler } from 'lucide-react';

import { Button } from '@/components/common';

export default function MethodologyButtons({
  openAssessmentMethodologyDrawer,
  openEvaluationCriteriaDrawer,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <motion.div>
        <Button onClick={openAssessmentMethodologyDrawer} size="lg" variant="secondary">
          <span>Assessment Methodology</span>
          <PencilRuler />
        </Button>
      </motion.div>

      <motion.div>
        <Button onClick={openEvaluationCriteriaDrawer} size="lg" variant="secondary">
          <span>Evaluation Criteria</span>
          <NotebookPen />
        </Button>
      </motion.div>
    </motion.div>
  );
}

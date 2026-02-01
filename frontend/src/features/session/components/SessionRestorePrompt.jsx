import React from 'react';
import PropTypes from 'prop-types';
import { RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * SessionRestorePrompt component
 *
 * Usage with useSession hook:
 * ```jsx
 * const { hasEvaluationState, restoreEvaluation, clearEvaluation } = useSession();
 *
 * {hasEvaluationState && (
 *   <SessionRestorePrompt
 *     onRestore={() => {
 *       const state = restoreEvaluation();
 *       // Apply state to form...
 *     }}
 *     onDismiss={() => clearEvaluation()}
 *   />
 * )}
 * ```
 */
export default function SessionRestorePrompt({ onRestore, onDismiss }) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-bold flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[#4a90e2]" strokeWidth={2.5} /> Restore Previous
            Session
          </DialogTitle>
          <DialogDescription className="sr-only">
            Restore your previous evaluation session data
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="mb-4 leading-relaxed">
            We found your previous evaluation session. Would you like to restore it?
          </p>
          <p className="m-0 text-sm text-gray-600">
            This includes your problem description, solution, and parameter settings.
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onDismiss}>
            Start Fresh
          </Button>
          <Button onClick={onRestore} className="bg-emerald-600 hover:bg-emerald-700">
            Restore Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

SessionRestorePrompt.propTypes = {
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

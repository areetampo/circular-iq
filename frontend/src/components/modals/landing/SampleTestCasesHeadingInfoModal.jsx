import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardPenLine, X, Lightbulb } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';

export default function SampleTestCasesHeadingInfoModal({ onClose, isModalOpen }) {
  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogClose
        className="absolute top-4 right-4"
        aria-label="Close sample test cases information modal"
      >
        <X className="w-5 h-5 text-gray-500 hover:text-gray-700" strokeWidth={2} />
      </DialogClose>
      <DialogContent className="w-full max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#2c3e50] flex items-center gap-2">
            <ClipboardPenLine /> About Sample Test Cases
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Pre-filled form submissions representing real business models
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <p className="mb-4 leading-relaxed">
            <strong>Test Cases</strong> are pre-filled form submissions representing real circular
            economy business models. They help you:
          </p>
          <ul className="mb-6 ml-5">
            <li className="mb-2">See what good problem/solution descriptions look like</li>
            <li className="mb-2">Understand parameter scoring in real-world contexts</li>
            <li className="mb-2">Quickly test the evaluation framework</li>
          </ul>

          <h3 className="mb-3 text-base font-bold text-slate-800">How They Work:</h3>
          <ol className="mb-6 ml-5">
            <li className="mb-2">
              <strong>Select:</strong> Pick any test case from the dropdown
            </li>
            <li className="mb-2">
              <strong>Auto-fill:</strong> Your form populates automatically
            </li>
            <li className="mb-2">
              <strong>Submit:</strong> Click &ldquo;Get Evaluation&rdquo; to see scores
            </li>
            <li className="mb-2">
              <strong>Learn:</strong> Review the evaluation against known results
            </li>
          </ol>

          <div className="p-4 border border-blue-300 rounded bg-blue-50">
            <p className="m-0 text-sm text-blue-900 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 text-blue-700 flex-shrink-0" strokeWidth={2} />
              <span>
                <strong>Tip:</strong> Test cases are great for learning how the evaluation system
                works before submitting your own idea.
              </span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

SampleTestCasesHeadingInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
};

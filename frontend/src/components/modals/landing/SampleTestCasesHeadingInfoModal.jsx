import React from 'react';
import PropTypes from 'prop-types';
import { ClipboardPenLine } from 'lucide-react';
import ModalHeading from '@/components/modals/core/ModalHeading';
import { LANDING_MODALS } from '../core/modalTypes';

export default function SampleTestCasesHeadingInfoModal({ onClose, isOpen }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-5 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeading
          title="About Sample Test Cases"
          icon={ClipboardPenLine}
          onClose={onClose}
          type={LANDING_MODALS.SAMPLE_TEST_CASES_HEADING_INFO}
        />
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
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
            <p className="m-0 text-sm text-blue-900">
              <strong>💡 Tip:</strong> Test cases are great for learning how the evaluation system
              works before submitting your own idea.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

SampleTestCasesHeadingInfoModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

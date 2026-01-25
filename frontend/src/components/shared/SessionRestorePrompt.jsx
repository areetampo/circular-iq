import PropTypes from 'prop-types';

export default function SessionRestorePrompt({ onRestore, onDismiss }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg max-w-sm w-full shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="m-0">🔄 Restore Previous Session</h2>
        </div>
        <div className="p-6">
          <p className="mb-4 leading-relaxed">
            We found your previous evaluation session. Would you like to restore it?
          </p>
          <p className="text-gray-600 text-sm m-0">
            This includes your problem description, solution, and parameter settings.
          </p>
        </div>
        <div className="flex gap-3 justify-end p-4 border-t border-gray-200">
          <button
            className="px-5 py-2 text-sm border border-gray-300 bg-white rounded cursor-pointer hover:bg-gray-50"
            onClick={onDismiss}
          >
            Start Fresh
          </button>
          <button
            className="px-5 py-2 text-sm bg-emerald-600 text-white border-none rounded cursor-pointer font-semibold hover:bg-emerald-700"
            onClick={onRestore}
          >
            Restore Session
          </button>
        </div>
      </div>
    </div>
  );
}

SessionRestorePrompt.propTypes = {
  onRestore: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
};

import { AlertCircle } from 'lucide-react';

export default function CompareInfoBox() {
  return (
    <div
      className="mt-12 p-6 rounded-lg"
      style={{
        backgroundColor: 'var(--info-soft)',
        borderColor: 'var(--info)',
        borderWidth: '1px',
      }}
    >
      <div className="flex gap-3">
        <AlertCircle size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--info)' }} />
        <div
          className="text-sm"
          style={{
            color: 'var(--info)',
          }}
        >
          <p className="font-semibold mb-2">About Comparison</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>You can compare any of your own assessments</li>
            <li>You can compare public assessments from other users</li>
            <li>Use the Assessment IDs from your assessments list or shared links</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

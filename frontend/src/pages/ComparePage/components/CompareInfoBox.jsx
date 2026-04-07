import { AlertCircle } from 'lucide-react';

export default function CompareInfoBox() {
  return (
    <div className="mt-12 rounded-lg border border-(--color-info) bg-(--color-info-soft) p-6">
      <div className="flex gap-3">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-(--color-info)" />
        <div className="text-sm text-(--color-info)">
          <p className="mb-2 font-semibold">About Comparison</p>
          <ul className="list-inside list-disc space-y-1">
            <li>You can compare any of your own assessments</li>
            <li>You can compare public assessments from other users</li>
            <li>Use the Assessment IDs from your assessments list or shared links</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

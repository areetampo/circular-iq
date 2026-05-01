import { GlobalActivity, GlobalActivityHeader } from './components';

export default function GlobalActivityPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
      <GlobalActivityHeader
        title="Global Activity"
        description="Live insights from all circular economy assessments worldwide"
      />

      <GlobalActivity />
    </div>
  );
}

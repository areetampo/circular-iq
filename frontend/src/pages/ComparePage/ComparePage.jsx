import { CompareForm, CompareHeader, CompareInfoBox } from './components';

export default function ComparePage() {
  return (
    <div className="max-w-4xl mx-auto py-16">
      <CompareHeader />
      <CompareForm />
      <CompareInfoBox />
    </div>
  );
}

ComparePage.propTypes = {};

export default function CompareHeader() {
  return (
    <div className="mb-8">
      <h1
        className="mb-2 text-3xl font-bold"
        style={{
          color: 'var(--foreground)',
        }}
      >
        Compare Assessments
      </h1>
      <p
        className="text-sm"
        style={{
          color: 'var(--muted)',
        }}
      >
        Enter the public IDs of two assessments you want to compare side by side.
      </p>
    </div>
  );
}

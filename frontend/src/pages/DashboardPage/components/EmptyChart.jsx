function EmptyChart() {
  return (
    <div className="flex items-center justify-center min-h-30">
      <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
        No data yet — run an assessment to see insights here.
      </p>
    </div>
  );
}

EmptyChart.propTypes = {};

export { EmptyChart };
export default EmptyChart;

import PropTypes from 'prop-types';

export default function Header({ title, subtitle }) {
  // Only render if title or subtitle is provided
  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className="border-b py-4" style={{ borderColor: 'var(--border)' }}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2
            className="text-lg font-medium mb-2"
            style={{
              color: 'var(--foreground)',
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className="text-sm"
            style={{
              color: 'var(--muted)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

Header.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

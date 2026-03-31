import PropTypes from 'prop-types';

export default function Header({ title, subtitle }) {
  // Only render if title or subtitle is provided
  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className="border-(--color-border) border-b py-4">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-(--color-text-primary) text-lg font-(--font-display) mb-2">
            {title}
          </h2>
        )}
        {subtitle && <p className="text-(--color-text-muted) text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

Header.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

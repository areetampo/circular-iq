import PropTypes from 'prop-types';

export default function Header({ title, subtitle }) {
  // Only render if title or subtitle is provided
  if (!title && !subtitle) {
    return null;
  }

  return (
    <div className="border-b border-border py-4">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="mb-2 font-display text-lg text-(--color-text-primary)">{title}</h2>
        )}
        {subtitle && <p className="text-sm text-(--color-text-muted)">{subtitle}</p>}
      </div>
    </div>
  );
}

Header.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

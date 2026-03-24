import PropTypes from 'prop-types';

/**
 * Reusable tip card component for displaying helpful guidance
 * Used in onboarding and instruction sections
 *
 * @param {string} icon - Emoji icon for the tip
 * @param {string} title - Bold title text
 * @param {string} description - Explanation text
 */
export default function TipCard({ icon, title, description }) {
  return (
    <div>
      <strong
        style={{
          color: 'var(--accent)',
        }}
      >
        {icon} {title}
      </strong>
      <p
        className="mt-2 text-sm"
        style={{
          color: 'var(--muted)',
        }}
      >
        {description}
      </p>
    </div>
  );
}

TipCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

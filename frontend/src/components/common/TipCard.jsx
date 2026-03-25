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
    <div
      className="border rounded-xl p-4 card-lift"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5">{icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
            {title}
          </h3>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

TipCard.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

import React from 'react';
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
      <strong style={{ color: '#1976d2' }}>
        {icon} {title}
      </strong>
      <p
        style={{
          margin: '0.5rem 0 0 0',
          fontSize: '0.95rem',
          color: '#555',
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

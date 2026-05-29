/**
 * H2-style heading used at the top of each major Guide section.
 */

import PropTypes from 'prop-types';

/**
 * Renders the standard heading used by each major Guide page section.
 */
export default function GuideSectionHeading({ children }) {
  return (
    <p className="mb-1 font-sans text-2xl font-medium text-(--color-text-primary)">{children}</p>
  );
}

GuideSectionHeading.propTypes = {
  children: PropTypes.node.isRequired,
};

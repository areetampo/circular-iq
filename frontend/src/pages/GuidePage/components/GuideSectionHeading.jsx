/**
 * @module GuideSectionHeading
 * @description H2-style heading used at the top of each major Guide section.
 */

import PropTypes from 'prop-types';

/**
 * H2-style title for a major Guide page section.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children - Section title text.
 * @returns {import('react').ReactElement}
 */
export default function GuideSectionHeading({ children }) {
  return (
    <p className="mb-1 font-sans text-2xl font-medium text-(--color-text-primary)">{children}</p>
  );
}

GuideSectionHeading.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * @module PageHeader
 * @description Reusable page title, description, and icon for feature pages.
 */

import PropTypes from 'prop-types';

/**
 * Page header component with title and description
 * @param {Object} props - Component props
 * @param {string} [props.title] - Page title
 * @param {string} [props.description] - Page description
 * @param {React.ComponentType} [props.icon] - Optional icon component
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 */
export default function PageHeader({ title, description, icon: Icon, ...props }) {
  return (
    <div {...props} className="flex items-end justify-between gap-4 pt-6">
      <div>
        <h1 className="flex items-center gap-3 font-sans text-[2rem] font-medium tracking-[-0.02em] text-(--color-text-primary)">
          {title}
          {Icon && <Icon size={28} className="text-(--color-success)" strokeWidth={2.5} />}
        </h1>
        <p className="text-sm/relaxed text-(--color-text-secondary)">{description}</p>
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  /** Page title */
  title: PropTypes.string.isRequired,
  /** Page description */
  description: PropTypes.string.isRequired,
  /** Optional icon component */
  icon: PropTypes.elementType,
};

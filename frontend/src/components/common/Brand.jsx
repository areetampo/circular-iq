/**
 * @module Brand
 * @description Site branding primitives: logo avatar, short name link, and full platform title.
 * Used in the navbar, auth panels, and anywhere the Xerneas identity is shown.
 */

import { Avatar } from '@heroui/react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { cn } from '@/utils/cn';

/** @constant {string} Short product name shown in navbar and auth UI. */
export const SITE_NAME = 'Xerneas';

/** @constant {string} Full platform title for hero sections and metadata. */
export const SITE_FULL_NAME = 'Circular Economy Evaluation Platform';

/**
 * SiteName component - displays the site name as a clickable link to home
 *
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered SiteName component
 *
 * @example
 * Basic usage
 * <SiteName />
 *
 * @example
 * With custom styling
 * <SiteName className="text-lg font-bold" />
 */
export const SiteName = ({ className, ...props }) => {
  return (
    // Spreading props here ensures onClick, target="_blank", etc., work natively on the anchor tag
    <Link to="/" {...props}>
      <span className={cn('inline-block cursor-pointer text-mauve-900', className)}>
        {SITE_NAME}
      </span>
    </Link>
  );
};

SiteName.propTypes = {
  className: PropTypes.string,
};

/**
 * SiteFullName component - displays the full site name as a span element
 *
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered SiteFullName component
 *
 * @example
 * Basic usage
 * <SiteFullName />
 *
 * @example
 * With custom styling
 * <SiteFullName className="text-xl" />
 */
export const SiteFullName = ({ className, ...props }) => (
  <span {...props} className={cn('inline-block text-(--color-text-secondary)', className)}>
    {SITE_FULL_NAME}
  </span>
);

SiteFullName.propTypes = {
  className: PropTypes.string,
};

/**
 * SiteLogo component - displays the site logo as a clickable Avatar that links to home
 *
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Avatar size
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered SiteLogo component
 *
 * @example
 * Basic usage
 * <SiteLogo />
 *
 * @example
 * Custom size
 * <SiteLogo size="lg" />
 *
 * @example
 * With custom styling
 * <SiteLogo className="border-2" />
 */
export const SiteLogo = ({ className, size = 'md', ...props }) => {
  return (
    <Avatar
      {...props}
      size={size}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-transparent!',
        className,
        'cursor-pointer',
      )}
      aria-label={`${SITE_NAME} - Go to home`}
    >
      <Link to="/">
        <Avatar.Image alt={SITE_NAME} src="/site-logo.png" />
        <Avatar.Fallback>logo</Avatar.Fallback>
      </Link>
    </Avatar>
  );
};

SiteLogo.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

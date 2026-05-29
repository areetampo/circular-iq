/** Site branding primitives for navigation, auth panels, and landing hero copy. */

import { Avatar } from '@heroui/react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { FlipWords } from '@/components/ui/flip-words';
import { cn } from '@/utils/cn';

import Tilt3D from './Tilt3D';

export const SITE_NAME = 'Xerneas';

export const SITE_FULL_NAME = 'Circular Economy Evaluation Platform';

/**
 * Renders the short product name as a home link.
 */
export const SiteName = ({ className, ...props }) => {
  return (
    // Forward link props so callers can attach native anchor behavior such as onClick.
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
 * Renders the full platform title as non-interactive text.
 */
export const SiteFullName = ({ className, ...props }) => (
  <span {...props} className={cn('inline-block text-mauve-600', className)}>
    {SITE_FULL_NAME}
  </span>
);

SiteFullName.propTypes = {
  className: PropTypes.string,
};

/**
 * Renders the product logo as a home link inside a HeroUI avatar.
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

/**
 * Renders the landing hero headline with mouse-tracked tilt and cycling suffix words.
 */
export const SiteHeroHeading = ({
  className,
  words = ['meets evidence.', 'drives impact.', 'builds purpose.', 'creates value.'],
  duration = 2000,
  ...props
}) => {
  return (
    <Tilt3D shadowMode="text" {...props}>
      <h1 className={cn('mb-6 **:font-display', className)}>
        <span className="block text-(--color-text-primary)">Where circular economy</span>
        <FlipWords words={words} duration={duration} className="text-orange-700 italic" />
      </h1>
    </Tilt3D>
  );
};

SiteHeroHeading.propTypes = {
  className: PropTypes.string,
  words: PropTypes.arrayOf(PropTypes.string),
  duration: PropTypes.number,
};

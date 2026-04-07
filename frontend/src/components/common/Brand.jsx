import { Avatar } from '@heroui/react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { cn } from '@/utils/cn';

export const SITE_NAME = 'Xerneas';
export const SITE_FULL_NAME = 'Circular Economy Evaluation Platform';

export const SiteName = ({ className = '' }) => {
  return (
    <Link to="/">
      <span className={cn(className, `cursor-pointer`)}>{SITE_NAME}</span>
    </Link>
  );
};

SiteName.propTypes = {
  className: PropTypes.string,
};

export const SiteFullName = ({ className = '' }) => (
  <span className={cn(className)}>{SITE_FULL_NAME}</span>
);

SiteFullName.propTypes = {
  className: PropTypes.string,
};

export const SiteLogo = ({ className = '', size = 'md' }) => {
  return (
    <Avatar
      size={size}
      className={cn(
        'inline-flex items-center justify-center rounded-full',
        className,
        'cursor-pointer',
      )}
      aria-label={`${SITE_NAME} - Go to home`}
    >
      <Link to="/">
        <Avatar.Image alt={SITE_NAME} src="/site-logo.png" />
        <Avatar.Fallback>{SITE_NAME}</Avatar.Fallback>
      </Link>
    </Avatar>
  );
};

SiteLogo.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

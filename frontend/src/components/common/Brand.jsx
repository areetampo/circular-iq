import { Avatar } from '@heroui/react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/utils/cn';

export const SITE_NAME = 'mystic mountains';
export const SITE_FULL_NAME = 'Circular Economy Evaluation Platform';

export const SiteName = ({ className = '' }) => <span className={cn(className)}>{SITE_NAME}</span>;

SiteName.propTypes = {
  className: PropTypes.string,
};

export const SiteFullName = ({ className = '' }) => (
  <span className={cn(className)}>{SITE_FULL_NAME}</span>
);

SiteFullName.propTypes = {
  className: PropTypes.string,
};

export const SiteLogo = ({ className = '' }) => {
  const navigate = useNavigate();

  return (
    <Avatar
      onClick={() => navigate('/')}
      className={cn('cursor-pointer rounded-full', className)}
      size="md"
      // color="success"
      // variant="soft"
      aria-label={`${SITE_NAME} - Go to home`}
    >
      <Avatar.Image alt={SITE_NAME} src="/siteLogo.png" />
      <Avatar.Fallback>{SITE_NAME}</Avatar.Fallback>
    </Avatar>
  );
};

SiteLogo.propTypes = {
  className: PropTypes.string,
};

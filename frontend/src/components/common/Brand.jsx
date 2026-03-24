import { Avatar } from '@heroui/react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { cn } from '@/utils/cn';

export const SITE_NAME = 'CE';
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

export default function Brand() {
  const navigate = useNavigate();

  return (
    <div className="inline-flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: 'var(--accent)' }}
      >
        <path
          d="M12 2L2 7L12 12L22 7L12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 17L12 22L22 17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2 12L12 17L22 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ color: 'var(--foreground)' }} className="text-base font-semibold">
        CE
      </span>
    </div>
  );
}

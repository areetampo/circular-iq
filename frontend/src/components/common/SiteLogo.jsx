import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@heroui/react';
import { cn } from '@/utils/cn';
import { SITE_CONFIG } from '@/constants/siteConfig';

export default function SiteLogo({ className = '' }) {
  const navigate = useNavigate();

  return (
    <Avatar
      onClick={() => navigate('/')}
      className={cn('cursor-pointer rounded-full', className)}
      size="md"
      // color="success"
      // variant="soft"
      aria-label={`${SITE_CONFIG.name} SiteLogo - Click to go home`}
    >
      <Avatar.Image alt={SITE_CONFIG.name} src="/siteLogo.png" />
      <Avatar.Fallback>{SITE_CONFIG.name}</Avatar.Fallback>
    </Avatar>
  );
}

SiteLogo.propTypes = {
  className: PropTypes.string,
};

import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

export default function Logo({ className = '' }) {
  const navigate = useNavigate();

  return (
    <img
      src="/logo.png"
      alt="logo"
      width={50}
      height={50}
      onClick={() => navigate('/')}
      className={`cursor-pointer rounded-full z-50 ${className}`}
    />
  );
}

Logo.propTypes = {
  className: PropTypes.string,
};

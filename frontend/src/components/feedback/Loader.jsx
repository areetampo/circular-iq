import React from 'react';
import PropTypes from 'prop-types';

export default function Loader({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-300 rounded-full border-t-green-500 animate-spin" />
      <h2 className="text-2xl font-semibold text-gray-800">{heading}</h2>
      <p className="text-base text-gray-600">{message}</p>
    </div>
  );
}

Loader.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};

import React from 'react';
import PropTypes from 'prop-types';
import LoaderIcon from './LoaderIcon';

export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <LoaderIcon className="" />

      {/* Fixed height container with vertical centering */}
      <div className="flex flex-col items-center justify-center h-12 max-w-md">
        <h2 className="text-2xl font-semibold text-center text-emerald-800">
          {heading || '\u00A0'}
        </h2>
      </div>

      {/* Fixed height container for message with vertical centering */}
      <div className="flex flex-col items-center justify-center h-8 max-w-lg">
        <p className="text-base text-center text-emerald-600">{message || '\u00A0'}</p>
      </div>
    </div>
  );
}

LoaderComponent.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};

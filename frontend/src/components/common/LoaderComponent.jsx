import PropTypes from 'prop-types';

import LoaderIcon from './LoaderIcon';

export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 pb-10">
      <LoaderIcon className="" />

      {/* Fixed height container with vertical centering */}
      <div className="flex flex-col items-center justify-center h-12 max-w-md">
        <h2
          className="text-2xl font-semibold text-center"
          style={{
            color: 'var(--success)',
            fontFamily: 'Lora, Georgia, serif',
          }}
        >
          {heading || '\u00A0'}
        </h2>
      </div>

      {/* Fixed height container for message with vertical centering */}
      <div className="flex flex-col items-center justify-center h-8">
        <p
          className="mx-8 text-base text-center text-wrap"
          style={{
            color: 'var(--accent)',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {message || '\u00A0'}
        </p>
      </div>
    </div>
  );
}

LoaderComponent.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};

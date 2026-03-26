import PropTypes from 'prop-types';

import LoaderIcon from './LoaderIcon';

export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <LoaderIcon className="" />
      {message && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {message}
        </p>
      )}
    </div>
  );
}

LoaderComponent.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};

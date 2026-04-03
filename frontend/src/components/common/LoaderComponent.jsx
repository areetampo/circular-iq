import PropTypes from 'prop-types';

import LoaderIcon from './LoaderIcon';

export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-2">
        <LoaderIcon />
        {heading && <p>{heading}</p>}
        {message && <p className="text-sm text-(--color-text-secondary)">{message}</p>}
      </div>
    </div>
  );
}

LoaderComponent.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};

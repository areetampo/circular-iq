import PropTypes from 'prop-types';

import LoaderIcon from './LoaderIcon';

export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="w-full h-full flex flex-col items-center gap-2 justify-center">
      <LoaderIcon />
      {heading && <p>{heading}</p>}
      {message && <p className="text-sm text-(--color-text-secondary)">{message}</p>}
    </div>
  );
}

LoaderComponent.propTypes = {
  heading: PropTypes.string,
  message: PropTypes.string,
};

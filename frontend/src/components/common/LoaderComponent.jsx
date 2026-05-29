/** Centered full-area loading state with LoaderIcon, heading, and message. */

import PropTypes from 'prop-types';

import LoaderIcon from './LoaderIcon';

/**
 * Renders a centered loading panel with optional heading and supporting message.
 */
export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
  ...props
}) {
  return (
    <div
      {...props}
      className="flex size-full min-h-[50vh] flex-col items-center justify-center gap-2"
    >
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

import PropTypes from 'prop-types';

import LoaderIcon from './LoaderIcon';

/**
 * LoaderComponent - A full-page loading component with heading and message
 * Displays a loader icon with optional heading and message text
 *
 * @param {Object} props - Component props
 * @param {string} [props.heading='Loading...'] - Heading text to display above the loader
 * @param {string} [props.message='Please wait while we retrieve your data...'] - Descriptive message to display below the heading
 * @returns {JSX.Element} Rendered LoaderComponent
 *
 * @example
 * Basic usage
 * <LoaderComponent />
 *
 * @example
 * Custom heading and message
 * <LoaderComponent heading="Fetching data..." message="This may take a few seconds..." />
 */
export default function LoaderComponent({
  heading = 'Loading...',
  message = 'Please wait while we retrieve your data...',
}) {
  return (
    <div className="flex size-full min-h-[50vh] flex-col items-center justify-center gap-2">
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

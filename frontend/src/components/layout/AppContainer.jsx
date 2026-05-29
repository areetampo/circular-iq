/** Responsive max-width wrapper for routed page content. */

import PropTypes from 'prop-types';

import { cn } from '@/utils/cn';

/**
 * Centers main page content with responsive horizontal padding and bottom spacing.
 */
export default function AppContainer({ children, className, ...props }) {
  return (
    <div
      {...props}
      className={cn(`mx-auto w-full max-w-330 px-4 pt-4 pb-12 sm:px-6 lg:px-8`, className)}
    >
      {children}
    </div>
  );
}

AppContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

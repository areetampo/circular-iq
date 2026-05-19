/**
 * @module AppContainer
 * @description Layout — App Container.
 */

import PropTypes from 'prop-types';

import DialogManager from '@/components/dialogs/DialogManager';
import { cn } from '@/utils/cn';

/**
 * Simple application container
 * Only constrains max-width and provides horizontal padding
 * No background colors, no title injection, no heavy styling
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to render
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered AppContainer component
 *
 * @example
 * Basic usage
 * <AppContainer>
 *   <div>App content here</div>
 * </AppContainer>
 *
 * @example
 * With custom styling
 * <AppContainer className="bg-gray-100">
 *   <div>App content here</div>
 * </AppContainer>
 */
export default function AppContainer({ children, className, ...props }) {
  return (
    <>
      <div
        {...props}
        className={cn(`mx-auto w-full max-w-330 px-4 pt-4 pb-12 sm:px-6 lg:px-8`, className)}
      >
        {children}
      </div>

      {/* Global Dialog Manager */}
      <DialogManager />
    </>
  );
}

AppContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

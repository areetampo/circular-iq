import PropTypes from 'prop-types';

import { DialogManager } from '@/components/dialogs';
import { cn } from '@/utils/cn';

/**
 * Simple application container
 * Only constrains max-width and provides horizontal padding
 * No background colors, no title injection, no heavy styling
 */
export default function AppContainer({ children, className = '' }) {
  return (
    <>
      <div className={cn('w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12', className)}>
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

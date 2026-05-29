/**
 * Logo and product-name lockup used by the authentication panels.
 */

import PropTypes from 'prop-types';

import { SiteFullName, SiteLogo, SiteName } from '@/components/common';
import { cn } from '@/utils/cn';

/**
 * Renders the auth brand lockup in either stacked desktop or compact row layout.
 */
export default function AuthBrandHeader({ className, layout = 'col' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        layout === 'row' && '-mt-2 mb-4 flex-row gap-2 pr-4',
        className,
      )}
    >
      <SiteLogo size="lg" />
      <SiteName
        className={cn(
          'font-display text-[2rem] font-semibold',
          layout === 'row' ? '-ml-1' : '-mt-1.5',
        )}
      />
      <SiteFullName className="hidden text-center font-sans text-[1.28rem] font-medium md_lg:block" />
    </div>
  );
}

AuthBrandHeader.propTypes = {
  className: PropTypes.string,
  layout: PropTypes.oneOf(['col', 'row']),
};

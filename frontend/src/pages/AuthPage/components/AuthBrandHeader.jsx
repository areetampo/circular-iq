import PropTypes from 'prop-types';

import { SiteFullName, SiteLogo, SiteName } from '@/components/common';
import { cn } from '@/utils/cn';

export default function AuthBrandHeader({ className, layout = 'col' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        className,
        layout === 'row' ? '-mt-4 mb-6 flex-row gap-2' : '',
      )}
    >
      <SiteLogo size="lg" />
      <SiteName
        className={cn(
          'font-display text-[2rem] font-semibold',
          layout === 'row' ? '-ml-1' : '-mt-1.5',
        )}
      />
      <SiteFullName className="hidden text-center font-sans text-[1.28rem] font-medium text-(--color-text-secondary) md_lg:block" />
    </div>
  );
}

AuthBrandHeader.propTypes = {
  className: PropTypes.string,
  layout: PropTypes.oneOf(['col', 'row']),
};

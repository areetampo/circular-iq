import PropTypes from 'prop-types';

import { SiteFullName, SiteLogo, SiteName } from '@/components/common';
import { cn } from '@/utils/cn';

export default function AuthBrandHeader({ className, layout = 'col' }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className,
        layout === 'row' ? '-mt-4 mb-6 flex-row gap-4' : '',
      )}
    >
      <SiteLogo size="lg" />
      <SiteName className="font-display text-[2rem] font-semibold" />
      <SiteFullName className="-mt-2 hidden text-center font-sans text-[1.28rem] font-medium text-(--color-text-secondary) md_lg:block" />
    </div>
  );
}

AuthBrandHeader.propTypes = {
  className: PropTypes.string,
  layout: PropTypes.oneOf(['col', 'row']),
};

import { SITE_FULL_NAME, SITE_NAME, SiteLogo } from '@/components/common';

export default function AuthBrandHeader() {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <SiteLogo size="lg" />
      <span className="font-display text-[1.5rem] font-semibold text-(--color-text-secondary)">
        {SITE_NAME}
      </span>
      <span className="font-body text-[1.28rem] font-medium text-(--color-text-secondary) text-center hidden md_lg:block">
        {SITE_FULL_NAME}
      </span>
    </div>
  );
}

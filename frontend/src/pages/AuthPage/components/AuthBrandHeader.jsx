import { SiteFullName, SiteLogo, SiteName } from '@/components/common';

export default function AuthBrandHeader() {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <SiteLogo size="lg" />
      <SiteName className="font-display text-[1.5rem] font-semibold text-(--color-text-secondary)" />
      <SiteFullName className="hidden text-center font-sans text-[1.28rem] font-medium text-(--color-text-secondary) md_lg:block" />
    </div>
  );
}

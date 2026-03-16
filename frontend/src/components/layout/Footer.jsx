import { Copyright } from 'lucide-react';

import { SITE_NAME, SiteLogo } from '@/components/common';

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 m-6">
      <SiteLogo />
      <span className="text-xs text-center text-zinc-500">
        <Copyright size={14} className="inline mb-0.5 mr-1" />
        {new Date().getFullYear()}&nbsp;{SITE_NAME}. All rights reserved. <br />
        Based on a research synthesis of AI applications in circular economy domains.
      </span>
    </div>
  );
}

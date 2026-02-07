import React from 'react';
import Logo from '@/components/common/Logo';
import { Copyright } from 'lucide-react';

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 m-6">
      <Logo />
      <span className="text-xs text-center text-zinc-500">
        <Copyright size={14} className="inline mb-0.5 mr-1" />
        {new Date().getFullYear()} Mahit. All rights reserved. <br />
        Based on a research synthesis of AI applications in circular economy domains.
      </span>
    </div>
  );
}

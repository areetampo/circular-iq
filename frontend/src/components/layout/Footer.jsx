import React from 'react';
import Logo from '@/components/common/Logo';

export default function Footer() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 m-6">
      <Logo />
      <span className="text-xs text-center text-zinc-500">
        &copy; {new Date().getFullYear()} Mahit. All rights reserved. <br />
        Based on research synthesis of AI applications in circular economy domains.
      </span>
    </div>
  );
}

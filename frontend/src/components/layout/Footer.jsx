import React from 'react';

export default function Footer() {
  return (
    <div className={'mt-8 text-sm text-slate-500'}>
      &copy; ${new Date().getFullYear()} _name. All rights reserved. Based on research synthesis of
      AI applications in circular economy domains.
    </div>
  );
}

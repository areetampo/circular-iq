import React from 'react';
import { Leaf } from 'lucide-react';

export default function Logo() {
  return (
    <img
      src="/logo.png"
      alt="logo"
      width={50}
      height={50}
      style={{
        borderRadius: '1000px',
      }}
    />
  );
}

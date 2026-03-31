import { SITE_FULL_NAME } from '@/components/common';

export default function AuthMobileHeader() {
  return (
    <div className="text-center">
      {/* Logo + Site Name */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <img src="/siteLogo.png" alt="Site Logo" className="h-6 w-auto" />
        <span className="font-(--font-display) text-sm text-(--color-text-primary)">
          {SITE_FULL_NAME}
        </span>
      </div>

      {/* Title and subtitle */}
      <h1 className="font-(--font-display) text-2xl text-(--color-text-primary) mb-1">Welcome</h1>
      <p className="text-sm text-(--color-text-muted)">
        Sign in to access your circular economy assessments
      </p>
    </div>
  );
}

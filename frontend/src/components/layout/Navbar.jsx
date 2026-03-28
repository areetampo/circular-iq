import { Dropdown } from '@heroui/react';
import { HelpCircle, LogOut, RefreshCw, Settings, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SITE_NAME } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const navRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
    { id: 'compare', name: 'Compare', path: '/assessments/compare' },
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'guide', name: 'Guide', path: '/guide' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut?.();
      navigate('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const userDropdownItems = [
    {
      id: 'assessments',
      name: 'My Assessments',
      icon: User,
      onClick: () => navigate('/assessments'),
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Settings,
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'compare',
      name: 'Compare',
      icon: Settings,
      onClick: () => navigate('/assessments/compare'),
    },
    {
      id: 'help',
      name: 'Help & Support',
      icon: HelpCircle,
      onClick: () => navigate('/guide'),
    },
    {
      id: 'signout',
      name: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'danger',
    },
  ];

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      if (navRef.current) {
        if (scrolled) {
          navRef.current.setAttribute('data-scrolled', 'true');
        } else {
          navRef.current.removeAttribute('data-scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePath = (path) => {
    const currentPath = location.pathname;
    if (path === '/assessments/compare') {
      return currentPath.startsWith('/assessments/compare');
    }
    if (path === '/assessments') {
      return (
        currentPath.startsWith('/assessments') && !currentPath.startsWith('/assessments/compare')
      );
    }
    return currentPath.startsWith(path);
  };

  const getUserInitials = () => {
    const username = profile?.username || user?.username;
    if (!username) return '?';
    return username
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleNavigation = (item) => {
    navigate(item.path);
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav
        ref={navRef}
        data-navbar
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          backgroundColor: 'oklch(0.97 0.012 80 / 0.82)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* LEFT: Brand */}
            <button
              onClick={() => navigate('/')}
              aria-label="Navigate to home page"
              className="flex items-center gap-2.5 group"
            >
              {/* Logo mark: small accent circle with RefreshCw icon */}
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center
                           transition-transform duration-200 group-hover:rotate-[-15deg]"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <RefreshCw size={14} strokeWidth={2.5} className="text-white" />
              </div>
              <span
                className="font-serif text-[15px] font-semibold tracking-tight hidden xs:inline"
                style={{ color: 'var(--foreground)' }}
              >
                {SITE_NAME}
              </span>
            </button>

            {/* CENTER: nav links (hidden below md) */}
            <div className="hidden md:flex items-center gap-7">
              {navigationItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    aria-label={`Navigate to ${item.name}`}
                    className="relative text-[13px] font-medium transition-colors duration-150 py-1"
                    style={{ color: isActive ? 'var(--foreground)' : 'var(--muted)' }}
                  >
                    {item.name}
                    {/* Active underline indicator */}
                    {isActive && (
                      <span
                        className="absolute -bottom-0.5 left-0 w-full h-[1.5px] rounded-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT: auth state */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Desktop User Dropdown */}
                  <div className="hidden md:block">
                    <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <Dropdown.Trigger
                        className="flex items-center gap-2 cursor-pointer transition-colors duration-150"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        aria-label="User menu"
                        aria-expanded={isDropdownOpen}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center
                                     text-[12px] font-semibold cursor-pointer
                                     transition-all duration-150 hover:ring-2 hover:ring-[var(--accent)]/40"
                          style={{
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent-soft-fg)',
                          }}
                        >
                          {getUserInitials()}
                        </div>
                      </Dropdown.Trigger>
                      <Dropdown.Popover>
                        <Dropdown.Menu
                          aria-label="User menu"
                          classNames={{
                            base: 'min-w-[200px]',
                            content: 'p-1',
                          }}
                        >
                          {/* User info header — non-interactive */}
                          <div
                            className="px-3 py-2 border-b"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <p
                              className="text-xs font-semibold truncate"
                              style={{ color: 'var(--foreground)' }}
                            >
                              {profile?.username || user?.username || 'User'}
                            </p>
                            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                              Circular Economy Assessor
                            </p>
                          </div>
                          {userDropdownItems.map((item) => (
                            <Dropdown.Item
                              key={item.id}
                              textValue={item.name}
                              onClick={item.onClick}
                              variant={item.variant}
                              classNames={{
                                base: 'gap-3 px-3 py-2',
                                title: 'text-sm font-medium',
                                description: 'text-xs',
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon
                                  size={16}
                                  className={
                                    item.variant === 'danger'
                                      ? 'text-[var(--danger)]'
                                      : 'text-[var(--muted)]'
                                  }
                                />
                                <span
                                  className="font-medium"
                                  style={{
                                    color:
                                      item.variant === 'danger'
                                        ? 'var(--danger)'
                                        : 'var(--foreground)',
                                  }}
                                >
                                  {item.name}
                                </span>
                              </div>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown.Popover>
                    </Dropdown>
                  </div>

                  {/* Mobile hamburger button */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={`${isMenuOpen ? 'Close' : 'Open'} mobile navigation menu`}
                    aria-expanded={isMenuOpen}
                    className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg
                               transition-colors duration-150"
                    style={{
                      backgroundColor: isMenuOpen ? 'var(--accent-soft)' : 'transparent',
                      color: 'var(--foreground)',
                    }}
                  >
                    {/* Animated hamburger → X using CSS transitions */}
                    <div className="w-5 flex flex-col gap-[5px] relative">
                      <span
                        className="block h-[1.5px] w-full rounded-full transition-all duration-300 origin-center"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          transform: isMenuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
                        }}
                      />
                      <span
                        className="block h-[1.5px] rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          width: isMenuOpen ? '0%' : '75%',
                          opacity: isMenuOpen ? 0 : 1,
                        }}
                      />
                      <span
                        className="block h-[1.5px] w-full rounded-full transition-all duration-300 origin-center"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          transform: isMenuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                        }}
                      />
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/auth')}
                    aria-label="Sign in to your account"
                    className="text-[13px] font-medium transition-colors text-[var(--muted)]
                               hover:text-[var(--foreground)]"
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    aria-label="Get started with your account"
                    className="text-[13px] font-medium px-4 py-1.5 rounded-lg
                               transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'oklch(0.18 0.015 60 / 0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile slide-in panel — from the right */}
      <div
        className={`fixed top-0 right-0 h-full z-50 md:hidden
                    flex flex-col transition-transform duration-300 ease-out`}
        style={{
          width: 'min(280px, 85vw)',
          backgroundColor: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 32px oklch(0.18 0.015 60 / 0.12)',
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Brand in panel */}
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <RefreshCw size={12} strokeWidth={2.5} className="text-white" />
            </div>
            <span
              className="font-serif text-[14px] font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {SITE_NAME}
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close mobile navigation menu"
            className="w-7 h-7 flex items-center justify-center rounded-md
                       transition-colors hover:bg-[var(--accent-soft)]"
            style={{ color: 'var(--muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* User info (if authenticated) */}
        {isAuthenticated && (
          <div
            className="flex items-center gap-3 px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center
                         text-[13px] font-semibold flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' }}
            >
              {getUserInitials()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {profile?.username || user?.username || 'User'}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Signed in
              </p>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          <p className="label-overline px-5 mb-2">NAVIGATE</p>
          {navigationItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                aria-label={`Navigate to ${item.name}`}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium
                            text-left transition-colors duration-150 relative`}
                style={{
                  color: isActive ? 'var(--foreground)' : 'var(--muted)',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {/* Accent bar for active */}
                {isActive && (
                  <span
                    className="absolute left-0 w-0.5 h-8 rounded-r"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
                {item.name}
                {isActive && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: auth actions */}
        <div className="border-t p-4 space-y-2" style={{ borderColor: 'var(--border)' }}>
          {isAuthenticated ? (
            <button
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
              aria-label="Sign out of your account"
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg
                         text-sm font-medium transition-colors duration-150
                         hover:bg-[var(--danger-soft)]"
              style={{ color: 'var(--danger)' }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/auth');
                setIsMenuOpen(false);
              }}
              aria-label="Sign in to your account"
              className="w-full py-2.5 rounded-lg text-sm font-medium
                         transition-all duration-150 hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </>
  );
}

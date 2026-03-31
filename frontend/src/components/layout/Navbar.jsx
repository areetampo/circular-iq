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
      {/* Floating pill wrapper — sits above content, doesn't push it */}
      <div
        className="sticky top-0 z-50 w-full flex justify-center px-4 pt-3 pb-1"
        style={{ pointerEvents: 'none' }}
      >
        <nav
          ref={navRef}
          data-navbar
          className="navbar-pill w-full max-w-4xl"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex items-center justify-between h-12 px-4">
            {/* LEFT: Brand */}
            <button
              onClick={() => navigate('/')}
              aria-label="Navigate to home page"
              className="flex items-center gap-2 shrink-0"
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <RefreshCw size={13} strokeWidth={2.5} className="text-white" />
              </div>
              <span
                className="font-serif text-[14px] font-semibold tracking-tight hidden xs:inline"
                style={{ color: 'var(--foreground)' }}
              >
                {SITE_NAME}
              </span>
            </button>

            {/* CENTER: nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    aria-label={`Navigate to ${item.name}`}
                    className="relative px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors duration-150"
                    style={{
                      color: isActive ? 'var(--foreground)' : 'var(--muted)',
                      backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                    }}
                  >
                    {item.name}
                    {isActive && (
                      <span
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                        style={{ backgroundColor: 'var(--accent)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT: auth */}
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated ? (
                <>
                  {/* Desktop dropdown — keep Dropdown.Popover/Menu contents exactly as before */}
                  <div className="hidden md:block">
                    <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                      <Dropdown.Trigger
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        aria-label="User menu"
                        aria-expanded={isDropdownOpen}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center
                                     text-[12px] font-semibold cursor-pointer
                                     transition-all duration-150 hover:ring-2 hover:ring-accent/40"
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
                          classNames={{ base: 'min-w-[200px]', content: 'p-1' }}
                        >
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
                              classNames={{ base: 'gap-3 px-3 py-2', title: 'text-sm font-medium' }}
                            >
                              <div className="flex items-center gap-3">
                                <item.icon
                                  size={16}
                                  className={
                                    item.variant === 'danger' ? 'text-danger' : 'text-muted'
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

                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={`${isMenuOpen ? 'Close' : 'Open'} mobile navigation menu`}
                    aria-expanded={isMenuOpen}
                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150"
                    style={{
                      backgroundColor: isMenuOpen ? 'var(--accent-soft)' : 'transparent',
                      color: 'var(--foreground)',
                    }}
                  >
                    <div className="w-4 flex flex-col gap-1 relative">
                      <span
                        className="block h-[1.5px] w-full rounded-full transition-all duration-300 origin-center"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          transform: isMenuOpen ? 'translateY(5.5px) rotate(45deg)' : 'none',
                        }}
                      />
                      <span
                        className="block h-[1.5px] rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          width: isMenuOpen ? '0%' : '70%',
                          opacity: isMenuOpen ? 0 : 1,
                        }}
                      />
                      <span
                        className="block h-[1.5px] w-full rounded-full transition-all duration-300 origin-center"
                        style={{
                          backgroundColor: 'var(--foreground)',
                          transform: isMenuOpen ? 'translateY(-5.5px) rotate(-45deg)' : 'none',
                        }}
                      />
                    </div>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/auth')}
                    aria-label="Sign in"
                    className="text-[13px] font-medium transition-colors"
                    style={{ color: 'var(--muted)' }}
                  >
                    Sign in
                  </button>
                  <button
                    onClick={() => navigate('/auth')}
                    aria-label="Get started"
                    className="text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors"
                    style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    Get started
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: 'oklch(0.18 0.015 60 / 0.3)', backdropFilter: 'blur(2px)' }}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full z-50 md:hidden flex flex-col transition-transform duration-300 ease-out`}
        style={{
          width: 'min(280px, 85vw)',
          backgroundColor: 'var(--background)',
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
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              <RefreshCw size={11} strokeWidth={2.5} className="text-white" />
            </div>
            <span
              className="font-serif text-[13px] font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {SITE_NAME}
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
            className="w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-accent-soft"
            style={{ color: 'var(--muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* User info */}
        {isAuthenticated && (
          <div
            className="flex items-center gap-3 px-5 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
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
        <nav className="flex-1 overflow-y-auto py-2">
          {navigationItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className="w-full flex items-center justify-between px-5 py-3 text-[14px] font-medium text-left transition-colors duration-150"
                style={{
                  color: isActive ? 'var(--foreground)' : 'var(--muted)',
                  backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                {item.name}
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom auth */}
        <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
          {isAuthenticated ? (
            <button
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-danger-soft"
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
              className="w-full py-2.5 rounded-full text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </>
  );
}

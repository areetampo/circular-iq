import { Avatar } from '@heroui/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SiteLogo, SiteName } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const dropdownRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'share', name: 'Share', path: '/assessments/share' },
    { id: 'compare', name: 'Compare', path: '/assessments/compare' },
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

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActivePath = (path) => {
    const currentPath = location.pathname;
    if (path === '/assessments/share') {
      return currentPath.startsWith('/assessments/share');
    }
    if (path === '/assessments/compare') {
      return currentPath.startsWith('/assessments/compare');
    }
    if (path === '/assessments') {
      return (
        currentPath.startsWith('/assessments') &&
        !currentPath.startsWith('/assessments/compare') &&
        !currentPath.startsWith('/assessments/share')
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

  const getUsername = () => {
    return profile?.username || user?.username || 'User';
  };

  return (
    <>
      {/* Main Navbar - full width sticky top bar */}
      <nav className="sticky top-3 z-50 h-13 px-8">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between rounded-full border border-(--color-border-strong) bg-(--color-bg)/60 px-6 shadow-sm backdrop-blur-3xl">
          {/* Logo + Site Name */}
          <div className="flex items-center gap-3">
            <SiteLogo />
            <SiteName className="font-display text-sm text-(--color-text-primary)" />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`relative cursor-pointer text-sm transition-colors ${
                    isActive
                      ? 'text-(--color-accent)'
                      : `text-(--color-text-secondary) hover:text-(--color-text-primary)`
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-2/3 -translate-x-1/2 rounded-full bg-(--color-accent)" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side - Profile Avatar or Auth */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              /* Profile Avatar Button */
              <div className="relative" ref={dropdownRef}>
                <Avatar
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                  size="sm"
                  style={{
                    backgroundColor: 'var(--color-accent-light)',
                    border: '2px solid var(--color-border-strong)',
                    color: 'var(--color-accent)',
                  }}
                  aria-label="Profile menu"
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="true"
                >
                  <Avatar.Fallback
                    style={{
                      backgroundColor: 'var(--color-accent-light)',
                      color: 'var(--color-accent)',
                      fontWeight: '500',
                    }}
                  >
                    {getUserInitials()}
                  </Avatar.Fallback>
                </Avatar>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 scale-100 overflow-hidden rounded-lg border border-(--color-border-strong) bg-(--color-bg) opacity-100 shadow-(--shadow-md) transition-all duration-150">
                    {/* User Info */}
                    <div className="border-b border-border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          size="sm"
                          style={{
                            backgroundColor: 'var(--color-accent-light)',
                            border: '2px solid var(--color-border-strong)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          <Avatar.Fallback
                            style={{
                              backgroundColor: 'var(--color-accent-light)',
                              color: 'var(--color-accent)',
                              fontWeight: '500',
                            }}
                          >
                            {getUserInitials()}
                          </Avatar.Fallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-(--color-text-primary)">
                            {getUsername()}
                          </p>
                          <p className="text-xs text-(--color-text-muted)">Signed in</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Links (shown in mobile dropdown) */}
                    <div className="border-b border-border py-2 md:hidden">
                      {navigationItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.path);
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full cursor-pointer px-4 py-2 text-left text-sm text-(--color-text-secondary) transition-colors hover:bg-(--color-accent-light) hover:text-(--color-text-primary)"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-(--color-error) transition-colors hover:bg-[rgba(139,58,58,0.07)]"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons */
              <div className="hidden items-center gap-3 md:flex">
                <button
                  onClick={() => navigate('/auth')}
                  className="cursor-pointer rounded-md px-4 py-2 text-sm text-slate-500 transition-colors hover:text-black"
                >
                  Sign in
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="cursor-pointer text-(--color-text-secondary) transition-colors hover:text-(--color-text-primary) md:hidden"
              aria-label={`${isMobileMenuOpen ? 'Close' : 'Open'} mobile menu`}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-in Panel */}
      <div
        id="mobile-menu"
        className={`fixed top-0 right-0 z-50 h-full w-72 transform border-l border-(--color-border-strong) bg-(--color-bg) shadow-xl transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-center border-b border-border p-6">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-(--color-text-muted) transition-colors hover:text-(--color-text-primary)"
            aria-label="Close mobile menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto">
          {isAuthenticated && (
            /* User Info */
            <div className="border-b border-border p-6">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full border border-(--color-border-strong) bg-(--color-accent-light) text-sm font-medium text-(--color-accent)">
                  {getUserInitials()}
                </div>
                <div>
                  <p className="text-sm font-medium text-(--color-text-primary)">{getUsername()}</p>
                  <p className="text-xs text-(--color-text-muted)">Signed in</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="py-4">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full cursor-pointer border-b border-border px-6 py-3 text-left text-base transition-colors ${
                    isActive
                      ? 'text-(--color-text-primary)'
                      : `text-(--color-text-secondary) hover:text-(--color-text-primary)`
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panel Footer */}
        <div className="border-t border-border p-6">
          {isAuthenticated ? (
            <button
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="w-full cursor-pointer text-sm text-(--color-error) transition-colors hover:text-(--color-text-primary)"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/auth');
                setIsMobileMenuOpen(false);
              }}
              className="w-full cursor-pointer rounded-md bg-(--color-accent) px-4 py-2.5 text-sm text-(--color-text-primary) transition-colors hover:bg-accent-hover"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </>
  );
}

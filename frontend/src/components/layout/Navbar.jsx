import { Avatar } from '@heroui/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

import { SITE_NAME } from '../common/Brand';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const dropdownRef = useRef(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
    { id: 'share', name: 'Share', path: '/assessments/share' },
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
      <nav className="sticky top-0 z-50 bg-(--color-bg)/80 backdrop-blur-md border-b border-border h-14">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo + Site Name */}
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <img
              src="/siteLogo.png"
              alt="Site Logo"
              className="h-7 w-auto"
              style={{ height: '28px' }}
            />
            <span className="font-(--font-display) text-sm text-(--color-text-primary)">
              {SITE_NAME}
            </span>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`text-sm cursor-pointer transition-colors relative ${
                    isActive
                      ? 'text-(--color-accent)'
                      : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-(--color-accent) rounded-full" />
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
                  <div className="absolute right-0 top-full mt-2 w-52 bg-(--color-bg) border border-(--color-border-strong) rounded-lg shadow-(--shadow-md) overflow-hidden opacity-100 scale-100 transition-all duration-150">
                    {/* User Info */}
                    <div className="p-4 border-b border-border">
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
                    <div className="md:hidden py-2 border-b border-border">
                      {navigationItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            navigate(item.path);
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-(--color-text-secondary) hover:text-(--color-text-primary) hover:bg-(--color-accent-light) transition-colors cursor-pointer"
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
                        className="w-full px-4 py-2 text-left text-sm text-(--color-error) hover:bg-[rgba(139,58,58,0.07)] transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Auth Buttons */
              <div className="hidden md:flex items-center gap-3">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-sm text-(--color-text-primary) bg-[#edd6bdc4] hover:bg-[#b8916a] px-4 py-2 rounded-md transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors cursor-pointer"
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-in Panel */}
      <div
        id="mobile-menu"
        className={`fixed top-0 right-0 h-full w-72 bg-(--color-bg) border-l border-(--color-border-strong) z-50 shadow-xl transform transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-center p-6 border-b border-border">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
            aria-label="Close mobile menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto">
          {isAuthenticated && (
            /* User Info */
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--color-accent-light) border border-(--color-border-strong) text-(--color-accent) text-sm font-medium flex items-center justify-center">
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
                  className={`w-full px-6 py-3 text-left text-base border-b border-border transition-colors cursor-pointer ${
                    isActive
                      ? 'text-(--color-text-primary)'
                      : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
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
              className="w-full text-sm text-(--color-error) hover:text-(--color-text-primary) transition-colors cursor-pointer"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => {
                navigate('/auth');
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-sm text-(--color-text-primary) bg-(--color-accent) hover:bg-accent-hover px-4 py-2.5 rounded-md transition-colors cursor-pointer"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </>
  );
}

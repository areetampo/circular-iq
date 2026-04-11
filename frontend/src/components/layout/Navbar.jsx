import { Avatar, Dropdown, DropdownTrigger, Separator } from '@heroui/react';
import { Menu } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button, SiteLogo, SiteName } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const dropdownRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const { openMobileNavigationDrawer } = useGlobalDrawer();

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'guide', name: 'Guide', path: '/guide' },
    { id: 'share', name: 'Share', path: '/assessments/share' },
    { id: 'compare', name: 'Compare', path: '/assessments/compare' },
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
            <SiteName className="font-display text-lg text-(--color-text-primary)" />
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`relative cursor-pointer font-sniglet text-sm transition-colors ${
                    isActive
                      ? 'text-(--color-accent)'
                      : `text-(--color-text-secondary) hover:text-(--color-text-primary)`
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-1/3 -translate-x-1/2 rounded-full bg-(--color-accent)" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - Profile Avatar or Auth */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              {isAuthenticated ? (
                /* Profile Avatar Dropdown */
                <Dropdown>
                  <DropdownTrigger>
                    <Avatar
                      size="sm"
                      className={cn(
                        'cursor-pointer transition-all duration-200 hover:scale-105',
                        'shadow-sm',
                        'border border-(--color-danger)/50',
                        'bg-(--color-accent-light)',
                        'text-(--color-accent)',
                      )}
                      aria-label="Profile menu"
                    >
                      <Avatar.Fallback className="bg-(--color-accent-light) font-medium text-(--color-accent)">
                        {getUserInitials()}
                      </Avatar.Fallback>
                    </Avatar>
                  </DropdownTrigger>
                  <Dropdown.Popover>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        key="user-info"
                        className="cursor-auto! py-2 hover:bg-(--color-accent-light)!"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="md"
                            className="bg-(--color-accent-light) text-(--color-accent)"
                          >
                            <Avatar.Fallback className="bg-[rgba(184,145,106,0.2)] font-medium text-(--color-accent)">
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
                      </Dropdown.Item>

                      <Separator className="my-2" variant="secondary" />

                      <Dropdown.Item
                        key="sign-out"
                        className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-(--color-error) transition-colors hover:bg-(--color-danger-soft-ui)"
                        onPress={() => {
                          handleSignOut();
                          setIsProfileDropdownOpen(false);
                        }}
                      >
                        Sign out
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              ) : (
                /* Auth Buttons */
                <div className="hidden items-center gap-3 md:flex">
                  <Button variant="ghastly" size="md" to="/auth" as={Link}>
                    Sign in
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={openMobileNavigationDrawer}
              className="text-(--color-text-secondary) transition-colors *:cursor-pointer hover:text-(--color-text-primary) md:hidden"
              aria-label="Open mobile navigation menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

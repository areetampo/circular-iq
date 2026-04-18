import { Avatar, Popover, Separator, Tooltip } from '@heroui/react';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button, SiteLogo, SiteName } from '@/components/common';
import {
  getTooltipTextForNavItemsSecondary,
  navigationItems,
  navItemsSecondary,
} from '@/constants/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';
import { getSession } from '@/utils/session';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut?.();
      navigate('/auth');
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

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
    if (!username) return '-';
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

  const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);

  return (
    <>
      {/* Main Navbar - full width sticky top bar */}
      <nav className="sticky top-3 z-50 h-13 px-8">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between rounded-full border border-(--color-border-strong) bg-(--color-bg-alpha-60) px-6 shadow-sm backdrop-blur-3xl">
          {/* Logo + Site Name */}
          <div className="flex items-center gap-1">
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
                  className={`relative cursor-pointer text-sm transition-colors duration-300 ${
                    isActive
                      ? 'font-medium text-(--color-accent)/90'
                      : `text-(--color-text-secondary)/75 hover:text-(--color-text-primary)`
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-1/4 -translate-x-1/2 rounded-full bg-(--color-accent)/90" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - Profile Avatar or Hamburger menu */}
          <div className="flex items-center gap-0">
            {!isAuthenticated && (
              <Button variant="ghost" size="sm" className="hidden md:block" as={Link} to="/auth">
                Sign In
              </Button>
            )}

            <Popover isOpen={isDesktopPopoverOpen} onOpenChange={setIsDesktopPopoverOpen}>
              <Popover.Trigger>
                {isAuthenticated ? (
                  <Avatar
                    size="sm"
                    className={cn(
                      'cursor-pointer transition-all duration-200 hover:scale-105',
                      'shadow-sm',
                      'border border-(--color-danger)/50',
                      'bg-(--color-accent-light)',
                      'text-(--color-accent)',
                      'hidden md:block',
                    )}
                    aria-label="Profile menu"
                  >
                    <Avatar.Fallback className="bg-(--color-hover-accent-strong) font-medium text-(--color-accent)">
                      {getUserInitials()}
                    </Avatar.Fallback>
                  </Avatar>
                ) : (
                  <button
                    type="button"
                    aria-label="Desktop hamburger menu"
                    className={cn(
                      'cursor-pointer items-center justify-center gap-2 rounded-lg font-sans outline-none',
                      'bg-transparent text-(--color-text-muted)',
                      'border border-transparent',
                      'hover:bg-(--color-hover-subtle) hover:text-(--color-text-primary)',
                      'transition-colors duration-150',
                      'px-3 py-1.5 text-xs',
                      'hidden hover:bg-transparent! md:-mr-4 md:block',
                    )}
                  >
                    <Menu size={16} />
                  </button>
                )}
              </Popover.Trigger>
              <Popover.Content className="min-w-45 p-0" placement="bottom right">
                <div className="flex flex-col">
                  {/* === ALL YOUR MENU ITEMS (copy exactly from old Dropdown.Menu) === */}
                  {isAuthenticated && (
                    <>
                      <div className="px-3 pt-3 pb-1">
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="md"
                            className="bg-(--color-accent-light) text-(--color-accent)"
                          >
                            <Avatar.Fallback className="bg-(--color-hover-accent-strong) text-lg font-medium text-(--color-accent)">
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
                      <Separator className="my-2" variant="secondary" />
                    </>
                  )}

                  {/* navItemsSecondary */}
                  {navItemsSecondary.map((item) => {
                    const sessionData = getSession();
                    const hasResults = Boolean(sessionData?.results);
                    const isDisabled = item.condition === 'hasResults' && !hasResults;

                    return (
                      <div key={item.id} className={cn('px-2', isAuthenticated ? '' : 'pt-3')}>
                        <Tooltip delay={0} className="w-full">
                          <Tooltip.Trigger className="w-full">
                            {item.type === 'link' && !isDisabled ? (
                              <Link
                                to={item.path}
                                className="flex w-full rounded-md px-2 py-1.5 text-sm text-(--color-text-primary) hover:bg-(--color-hover-subtle)"
                                onClick={() => setIsDesktopPopoverOpen(false)}
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
                                {item.name}
                              </span>
                            )}
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            <p className="whitespace-pre-line">
                              {getTooltipTextForNavItemsSecondary(item, sessionData)}
                            </p>
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                    );
                  })}

                  <Separator className="my-2" variant="secondary" />

                  {/* Sign out / Sign in */}
                  <div className="px-2 pt-1 pb-2">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleSignOut();
                          navigate('/auth');
                          setIsDesktopPopoverOpen(false);
                        }}
                        className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-error) hover:bg-(--color-danger-soft-ui)"
                      >
                        Sign out
                      </button>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setIsDesktopPopoverOpen(false)}
                        className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-success) hover:bg-(--color-success-soft-ui)"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </Popover.Content>
            </Popover>

            {/* Mobile Navigation Dropdown */}
            <Popover
              isOpen={isMobilePopoverOpen}
              onOpenChange={setIsMobilePopoverOpen}
              className="md:hidden"
            >
              <Popover.Trigger>
                <button
                  type="button"
                  aria-label="Mobile navigation menu"
                  className={cn(
                    // Styles from Button variant="ghastly" size="md"
                    'cursor-pointer items-center justify-center gap-2 rounded-lg font-sans outline-none',
                    'bg-transparent text-(--color-text-muted)',
                    'border border-transparent',
                    'hover:bg-(--color-hover-subtle) hover:text-(--color-text-primary)',
                    'transition-colors duration-150',
                    'px-4 py-2 text-sm',
                    'w-full md:hidden',
                  )}
                >
                  <Menu size={20} />
                </button>
              </Popover.Trigger>
              <Popover.Content className="min-w-45 p-0" placement="bottom right">
                <div className="flex flex-col">
                  {isAuthenticated && (
                    <>
                      <div className="px-3 pt-3 pb-1">
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="md"
                            className="bg-(--color-accent-light) text-(--color-accent)"
                          >
                            <Avatar.Fallback className="bg-(--color-hover-accent-strong) text-lg font-medium text-(--color-accent)">
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
                      <Separator className="my-2" variant="secondary" />
                    </>
                  )}

                  {/* Navigation items (same as desktop) */}
                  <div className={cn(isAuthenticated ? '' : 'pt-1')}>
                    {navigationItems.map((item) => {
                      const isActive = isActivePath(item.path);
                      return (
                        <div key={item.id} className="px-2 py-1">
                          <Link
                            to={item.path}
                            className={cn(
                              'flex w-full rounded-md px-2 py-1.5 text-sm',
                              isActive
                                ? 'bg-(--color-accent-light) text-(--color-accent)'
                                : 'text-(--color-text-primary) hover:bg-(--color-hover-subtle)',
                            )}
                            onClick={() => setIsMobilePopoverOpen(false)}
                          >
                            {item.name}
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Secondary items with tooltips */}
                  {navItemsSecondary.map((item) => {
                    const sessionData = getSession();
                    const hasResults = Boolean(sessionData?.results);
                    const isDisabled = item.condition === 'hasResults' && !hasResults;

                    return (
                      <div key={item.id} className="px-2 py-1">
                        <Tooltip delay={0} className="w-full">
                          <Tooltip.Trigger className="w-full">
                            {item.type === 'link' && !isDisabled ? (
                              <Link
                                to={item.path}
                                className="flex w-full rounded-md px-2 py-1.5 text-sm text-(--color-text-primary) hover:bg-(--color-hover-subtle)"
                                onClick={() => setIsMobilePopoverOpen(false)}
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
                                {item.name}
                              </span>
                            )}
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            <p className="whitespace-pre-line">
                              {getTooltipTextForNavItemsSecondary(item, sessionData)}
                            </p>
                          </Tooltip.Content>
                        </Tooltip>
                      </div>
                    );
                  })}

                  <Separator className="my-2" variant="secondary" />

                  {/* Auth action */}
                  <div className="px-2 pt-1 pb-2">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        onClick={() => {
                          handleSignOut();
                          navigate('/auth');
                          setIsDesktopPopoverOpen(false);
                        }}
                        className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-error) hover:bg-(--color-danger-soft-ui)"
                      >
                        Sign out
                      </button>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setIsDesktopPopoverOpen(false)}
                        className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-success) hover:bg-(--color-success-soft-ui)"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </Popover.Content>
            </Popover>
          </div>
        </div>
      </nav>
    </>
  );
}

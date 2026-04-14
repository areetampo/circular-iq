import { Avatar, Dropdown, Separator, Tooltip } from '@heroui/react';
import { Menu } from 'lucide-react';
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
      console.error('Sign out error:', error);
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

          {/* Right side - Profile Avatar or Hamburger menu */}
          <div className="flex items-center gap-0">
            {!isAuthenticated && (
              <Button variant="ghost" size="sm" className="hidden md:block" as={Link} to="/auth">
                Sign In
              </Button>
            )}

            <Dropdown>
              <Dropdown.Trigger>
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
                  <Button
                    variant="ghastly"
                    size="sm"
                    aria-label="Desktop hamburger menu"
                    className="hidden hover:bg-transparent! md:-mr-4 md:block"
                  >
                    <Menu size={16} />
                  </Button>
                )}
              </Dropdown.Trigger>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu>
                  {isAuthenticated && (
                    <>
                      <Dropdown.Item
                        key="user-info"
                        className="cursor-auto! py-2 hover:bg-(--color-accent-light)!"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="md"
                            className="bg-(--color-accent-light) text-(--color-accent)"
                          >
                            <Avatar.Fallback className="bg-(--color-hover-accent-strong) font-medium text-(--color-accent)">
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
                    </>
                  )}

                  {navItemsSecondary.map((item) => {
                    const sessionData = getSession();
                    const hasResults = Boolean(sessionData?.results);
                    const isDisabled = item.condition === 'hasResults' && !hasResults;

                    return (
                      <Dropdown.Item
                        key={item.id}
                        // isDisabled classes present in index.css
                        isDisabled={isDisabled}
                      >
                        <Tooltip delay={0} className="w-full">
                          <Tooltip.Trigger className="w-full">
                            {item.type === 'link' && !isDisabled ? (
                              <Link to={item.path} className="flex w-full">
                                {item.name}
                              </Link>
                            ) : (
                              /* When disabled, we render a span so there is no 'to' attribute for the browser to find */
                              <span className="flex w-full cursor-not-allowed">{item.name}</span>
                            )}
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            <p className="whitespace-pre-line">
                              {getTooltipTextForNavItemsSecondary(item, sessionData)}
                            </p>
                          </Tooltip.Content>
                        </Tooltip>
                      </Dropdown.Item>
                    );
                  })}

                  <Separator className="my-2" variant="secondary" />

                  <Dropdown.Item
                    key="handle-auth"
                    className={cn(
                      isAuthenticated
                        ? 'text-(--color-error)! hover:bg-(--color-danger-soft-ui)!'
                        : 'text-(--color-success)! hover:bg-(--color-success-soft-ui)!',
                    )}
                    onPress={isAuthenticated ? handleSignOut : undefined}
                  >
                    {isAuthenticated ? <span>Sign out</span> : <Link to="/auth">Sign in</Link>}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            {/* Mobile Navigation Dropdown */}
            <Dropdown>
              <Dropdown.Trigger>
                <Button
                  variant="ghastly"
                  size="md"
                  aria-label="Mobile navigation menu"
                  className="w-full md:hidden"
                >
                  <Menu size={20} />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Popover
                placement="bottom end"
                style={{ minWidth: '180px' }} // ← prevents width collapse on open
                motionProps={{
                  variants: {
                    enter: { opacity: 1, y: 0, transition: { duration: 0.15 } },
                    exit: { opacity: 0, y: -4, transition: { duration: 0.1 } },
                  },
                }}
              >
                <Dropdown.Menu>
                  {isAuthenticated && (
                    <>
                      <Dropdown.Item
                        key="user-info"
                        className="cursor-auto! py-2 hover:bg-(--color-accent-light)!"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar
                            size="md"
                            className="bg-(--color-accent-light) text-(--color-accent)"
                          >
                            <Avatar.Fallback className="bg-(--color-hover-accent-strong) font-medium text-(--color-accent)">
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
                    </>
                  )}

                  {navigationItems.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <Dropdown.Item key={item.id}>
                        <Link key={item.id} to={item.path}>
                          <span className={cn(isActive && 'text-black')}>{item.name}</span>
                        </Link>
                      </Dropdown.Item>
                    );
                  })}

                  {navItemsSecondary.map((item) => {
                    const sessionData = getSession();
                    const hasResults = Boolean(sessionData?.results);
                    const isDisabled = item.condition === 'hasResults' && !hasResults;

                    return (
                      <Dropdown.Item
                        key={item.id}
                        // isDisabled classes present in index.css
                        isDisabled={isDisabled}
                      >
                        <Tooltip delay={0} className="w-full">
                          <Tooltip.Trigger className="w-full">
                            {item.type === 'link' && !isDisabled ? (
                              <Link to={item.path} className="flex w-full">
                                {item.name}
                              </Link>
                            ) : (
                              /* When disabled, we render a span so there is no 'to' attribute for the browser to find */
                              <span className="flex w-full cursor-not-allowed">{item.name}</span>
                            )}
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            <p className="whitespace-pre-line">
                              {getTooltipTextForNavItemsSecondary(item, sessionData)}
                            </p>
                          </Tooltip.Content>
                        </Tooltip>
                      </Dropdown.Item>
                    );
                  })}

                  <Separator className="my-2" variant="secondary" />

                  <Dropdown.Item
                    key="handle-auth"
                    className={cn(
                      isAuthenticated
                        ? 'text-(--color-error)! hover:bg-(--color-danger-soft-ui)!'
                        : 'text-(--color-success)! hover:bg-(--color-success-soft-ui)!',
                    )}
                    onPress={isAuthenticated ? handleSignOut : undefined}
                  >
                    {isAuthenticated ? <span>Sign out</span> : <Link to="/auth">Sign in</Link>}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>
      </nav>
    </>
  );
}

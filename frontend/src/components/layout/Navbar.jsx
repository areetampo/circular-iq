import { Avatar, Popover, Tooltip } from '@heroui/react';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button, Separator, SiteLogo, SiteName } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { formatTimestamp, getUserInitials } from '@/lib/formatting';
import { cn } from '@/utils/cn';
import { getSession } from '@/utils/session';

// Navigation items
const navItemsPrimary = [
  { id: 'assessments', name: 'My Assessments', path: '/assessments' },
  { id: 'solutions', name: 'Solutions', path: '/solutions' },
  { id: 'global-activity', name: 'Global Activity', path: '/global-activity' },
  { id: 'guide', name: 'Guide', path: '/guide' },
];

const navItemsSecondary = [
  {
    id: 'share',
    name: 'Shared Assessments',
    path: '/assessments/share',
    type: 'link',
  },
  {
    id: 'compare',
    name: 'Compare Assessments',
    path: '/assessments/compare',
    type: 'link',
  },
  {
    id: 'unsaved-results',
    name: 'Recover Calculation',
    path: '/results',
    type: 'link',
  },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut?.();
      navigate('/auth', { state: { from: location } });
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  const isActivePath = (path) => {
    const currentPath = location.pathname;
    if (path === '/assessments') {
      return (
        currentPath.startsWith('/assessments') &&
        !currentPath.startsWith('/assessments/compare') &&
        !currentPath.startsWith('/assessments/share')
      );
    }
    return currentPath.startsWith(path);
  };

  const getUsername = () => {
    return profile?.username || user?.username || 'User';
  };

  const getTooltipTextForUnsavedResults = (sessionData) => {
    const hasResults = Boolean(sessionData?.results);

    if (!hasResults) {
      return 'No previous calculation results found to display';
    }

    if (sessionData?.results?.processing_info?.timestamp) {
      const formattedTimestamp = formatTimestamp(sessionData.results.processing_info.timestamp);
      return `View the results of your last calculation\nfrom [${formattedTimestamp}]`;
    }

    return 'View the results of your last calculation';
  };

  const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);

  return (
    <nav className="sticky top-3 z-50 h-13 px-8">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between rounded-full border border-(--color-border-strong) bg-(--color-bg-alpha-60) px-6 shadow-sm backdrop-blur-3xl">
        {/* Left -> Logo + Site Name */}
        <div className="flex items-center gap-1">
          <SiteLogo />
          <SiteName className="font-display text-lg text-(--color-text-primary)" />
        </div>

        {/* Middle -> desktop primary navigation items */}
        <div className="hidden items-center gap-8 md:flex">
          {navItemsPrimary.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`relative cursor-pointer text-sm transition-colors duration-300 ${
                  isActive
                    ? 'text-(--color-checkbox-hover)'
                    : `text-(--color-text-secondary)/75 hover:text-(--color-text-primary)`
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-0.5 w-1/5 -translate-x-1/2 rounded-full bg-(--color-checkbox-hover)/80" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right -> sign in (for unauthenticated user) + hamburger menu */}
        <div className="flex items-center gap-0">
          {!isAuthenticated && (
            <Button variant="ghost" size="sm" as={Link} to="/auth" state={{ from: location }}>
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
                    {getUserInitials(profile?.username || user?.username)}
                  </Avatar.Fallback>
                </Avatar>
              ) : (
                <button
                  type="button"
                  aria-label="Desktop hamburger menu"
                  className={cn(
                    // Styles from Button variant="ghastly"
                    'cursor-pointer items-center justify-center gap-2 rounded-lg font-sans outline-none',
                    'bg-transparent text-(--color-text-muted)',
                    'hover:text-(--color-text-primary)',
                    'transition-colors duration-150',
                    'px-3 py-1.5 text-xs',
                    'hidden md:-mr-4 md:block',
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
                            {getUserInitials(profile?.username || user?.username)}
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
                    <Separator wrapperCn="my-2" />
                  </>
                )}

                {/* desktop hamburger menu secondary navigation items */}
                {navItemsSecondary.map((item) => {
                  const sessionData = getSession();
                  const hasResults = Boolean(sessionData?.results);
                  const isDisabled = item.id === 'unsaved-results' && !hasResults;
                  const showTooltip = item.id === 'unsaved-results';
                  const isActive = isActivePath(item.path);

                  return (
                    <div key={item.id} className={cn('px-2', isAuthenticated ? '' : 'pt-3')}>
                      {/* tooltip style item only for results restore */}
                      {showTooltip ? (
                        <Tooltip delay={0} className="w-full">
                          <Tooltip.Trigger className="w-full">
                            {/* resutls restore active */}
                            {item.type === 'link' && !isDisabled ? (
                              <Link
                                to={item.path}
                                className={cn(
                                  'flex w-full rounded-md px-2 py-1.5 text-sm',
                                  isActive
                                    ? 'bg-(--color-accent-light) text-(--color-checkbox-primary)'
                                    : 'text-(--color-text-primary) hover:bg-(--color-hover-subtle)',
                                )}
                                onClick={() => setIsDesktopPopoverOpen(false)}
                              >
                                {item.name}
                              </Link>
                            ) : (
                              // results restore disabled
                              <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
                                {item.name}
                              </span>
                            )}
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            <p className="whitespace-pre-line">
                              {getTooltipTextForUnsavedResults(sessionData)}
                            </p>
                          </Tooltip.Content>
                        </Tooltip>
                      ) : (
                        // other secondary nav items
                        <div className="w-full">
                          {item.type === 'link' && !isDisabled ? (
                            <Link
                              to={item.path}
                              className={cn(
                                'flex w-full rounded-md px-2 py-1.5 text-sm',
                                isActive
                                  ? 'bg-(--color-accent-light) text-(--color-checkbox-primary)'
                                  : 'text-(--color-text-primary) hover:bg-(--color-hover-subtle)',
                              )}
                              onClick={() => setIsDesktopPopoverOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
                              {item.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Separator wrapperCn="my-2" />

                {/* Sign out / Sign in */}
                <div className="px-2 pt-1 pb-2">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        navigate('/auth', { state: { from: location } });
                        setIsDesktopPopoverOpen(false);
                      }}
                      className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-error) hover:bg-(--color-danger-soft-ui)"
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      state={{ from: location }}
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

          {/* Mobile Navigation - Dropdown */}
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
                  // Styles from Button variant="ghastly"
                  'cursor-pointer items-center justify-center gap-2 rounded-lg font-sans outline-none',
                  'bg-transparent text-(--color-text-muted)',
                  'hover:text-(--color-text-primary)',
                  'transition-colors duration-150',
                  'px-3 py-1.5 text-xs',
                  '-mr-4 block md:hidden',
                )}
              >
                <Menu size={16} />
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
                            {getUserInitials(profile?.username || user?.username)}
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
                    <Separator wrapperCn="my-2" />
                  </>
                )}

                {/* mobile hamburger menu primary navigation items */}
                <div className={cn(isAuthenticated ? '' : 'pt-1')}>
                  {navItemsPrimary.map((item) => {
                    const isActive = isActivePath(item.path);
                    return (
                      <div key={item.id} className="px-2 py-1">
                        <Link
                          to={item.path}
                          className={cn(
                            'flex w-full rounded-md px-2 py-1.5 text-sm',
                            isActive
                              ? 'bg-(--color-accent-light) text-(--color-checkbox-primary)'
                              : 'text-(--color-text-secondary) hover:bg-(--color-hover-subtle)',
                          )}
                          onClick={() => setIsMobilePopoverOpen(false)}
                        >
                          {item.name}
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* mobile hamburger menu secondary navigation items */}
                {navItemsSecondary.map((item) => {
                  const sessionData = getSession();
                  const hasResults = Boolean(sessionData?.results);
                  const isDisabled = item.id === 'unsaved-results' && !hasResults;
                  const showTooltip = item.id === 'unsaved-results';
                  const isActive = isActivePath(item.path);

                  return (
                    <div key={item.id} className="px-2 py-1">
                      {/* tooltip style item only for results restore */}
                      {showTooltip ? (
                        <Tooltip delay={0} className="w-full">
                          <Tooltip.Trigger className="w-full">
                            {/* resutls restore active */}
                            {item.type === 'link' && !isDisabled ? (
                              <Link
                                to={item.path}
                                className={cn(
                                  'flex w-full rounded-md px-2 py-1.5 text-sm',
                                  isActive
                                    ? 'bg-(--color-accent-light) text-(--color-checkbox-primary)'
                                    : 'text-(--color-text-secondary) hover:bg-(--color-hover-subtle)',
                                )}
                                onClick={() => setIsMobilePopoverOpen(false)}
                              >
                                {item.name}
                              </Link>
                            ) : (
                              // results restore disabled
                              <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
                                {item.name}
                              </span>
                            )}
                          </Tooltip.Trigger>
                          <Tooltip.Content>
                            <p className="whitespace-pre-line">
                              {getTooltipTextForUnsavedResults(sessionData)}
                            </p>
                          </Tooltip.Content>
                        </Tooltip>
                      ) : (
                        // other secondary nav items
                        <div className="w-full">
                          {item.type === 'link' && !isDisabled ? (
                            <Link
                              to={item.path}
                              className={cn(
                                'flex w-full rounded-md px-2 py-1.5 text-sm',
                                isActive
                                  ? 'bg-(--color-accent-light) text-(--color-checkbox-primary)'
                                  : 'text-(--color-text-secondary) hover:bg-(--color-hover-subtle)',
                              )}
                              onClick={() => setIsMobilePopoverOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ) : (
                            <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
                              {item.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Separator wrapperCn="my-2" />

                {/* Auth action */}
                <div className="px-2 pt-1 pb-2">
                  {isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleSignOut();
                        navigate('/auth', { state: { from: location } });
                        setIsDesktopPopoverOpen(false);
                      }}
                      className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-error) hover:bg-(--color-danger-soft-ui)"
                    >
                      Sign out
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      state={{ from: location }}
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
  );
}

/** Primary site navigation with auth popovers and session-aware secondary links. */

import { Avatar, Popover, Tooltip } from '@heroui/react';
import { Menu } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button, Separator, SiteLogo, SiteName } from '@/components/common';
import { useAuth } from '@/hooks';
import { formatTimestamp, getUserInitials } from '@/lib/formatting';
import { cn } from '@/utils/cn';
import { getSession } from '@/utils/session';

/** Primary route links shown directly in the desktop header and mobile menu. */
const navItemsPrimary = [
  { id: 'assessments', name: 'My Assessments', path: '/assessments' },
  { id: 'solutions', name: 'Solutions', path: '/solutions' },
  { id: 'global-activity', name: 'Global Activity', path: '/global-activity' },
  { id: 'guide', name: 'Guide', path: '/guide' },
];

/** Secondary route links shown inside the desktop and mobile popovers. */
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
  {
    id: 'uptime-monitor',
    name: 'Uptime Monitor',
    path: '/uptime-monitor',
    type: 'link',
  },
];

/**
 * Tooltip copy for the "Recover Calculation" nav item based on session state.
 *
 * @param {Object|null|undefined} sessionData - Stored session payload returned by `getSession()`.
 * @returns {string} Tooltip copy describing whether a previous calculation is available.
 */
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

/**
 * Renders a primary or secondary nav link, or a disabled placeholder when navigation is unavailable.
 */
function NavLinkItem({ item, isActive, isDisabled, onClose }) {
  const linkClass = cn(
    'flex w-full rounded-md px-2 py-1.5 text-sm',
    isActive
      ? 'bg-(--color-accent-light) text-(--color-dark-brown-primary)'
      : 'text-(--color-text-secondary) hover:bg-(--color-hover-subtle)',
  );

  if (isDisabled) {
    return (
      <span className="flex w-full cursor-not-allowed rounded-md px-2 py-1.5 text-sm text-(--color-text-muted)">
        {item.name}
      </span>
    );
  }

  return (
    <Link to={item.path} className={linkClass} onClick={onClose}>
      {item.name}
    </Link>
  );
}

const navItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
});

NavLinkItem.propTypes = {
  item: navItemShape.isRequired,
  isActive: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
};

/**
 * Renders secondary nav links with session-aware disable and tooltip state for unsaved results.
 */
function SecondaryNavItems({ isAuthenticated, isActivePath, onClose }) {
  return navItemsSecondary.map((item) => {
    const sessionData = getSession();
    const hasResults = Boolean(sessionData?.results);
    const isDisabled = item.id === 'unsaved-results' && !hasResults;
    const showTooltip = item.id === 'unsaved-results';
    const isActive = isActivePath(item.path);

    return (
      <div
        key={item.id}
        className={cn('px-2 py-1', !isAuthenticated && item === navItemsSecondary[0] ? 'pt-3' : '')}
      >
        {showTooltip ? (
          <Tooltip delay={0} className="w-full">
            <Tooltip.Trigger className="w-full" tabIndex={0}>
              <NavLinkItem
                item={item}
                isActive={isActive}
                isDisabled={isDisabled}
                onClose={onClose}
              />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <p className="whitespace-pre-line">{getTooltipTextForUnsavedResults(sessionData)}</p>
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <div className="w-full">
            <NavLinkItem
              item={item}
              isActive={isActive}
              isDisabled={isDisabled}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    );
  });
}

SecondaryNavItems.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  isActivePath: PropTypes.func.isRequired,
  onClose: PropTypes.func,
};

/**
 * Renders the authenticated user's avatar and username at the top of the profile popover.
 */
function ProfileHeader({ profile, user, getUserInitials, getUsername }) {
  return (
    <>
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-3">
          <Avatar size="md" className="bg-(--color-accent-light) text-(--color-accent)">
            <Avatar.Fallback className="bg-(--color-hover-accent-strong) text-lg font-medium text-(--color-accent)">
              {getUserInitials(profile?.username || user?.username)}
            </Avatar.Fallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-(--color-text-primary)">{getUsername()}</p>
            <p className="text-xs text-(--color-text-muted)">Signed in</p>
          </div>
        </div>
      </div>
      <Separator wrapperCn="my-2" />
    </>
  );
}

ProfileHeader.propTypes = {
  profile: PropTypes.object,
  user: PropTypes.object,
  getUserInitials: PropTypes.func.isRequired,
  getUsername: PropTypes.func.isRequired,
};

/**
 * Renders the sign-in link or sign-out button at the bottom of the nav popover.
 */
function AuthAction({ isAuthenticated, onSignOut, onClose, location }) {
  return (
    <div className="px-2 pt-1 pb-2">
      {isAuthenticated ? (
        <button
          type="button"
          onClick={() => {
            onSignOut();
            onClose();
          }}
          className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-error) hover:bg-(--color-danger-soft-ui)"
        >
          Sign out
        </button>
      ) : (
        <Link
          to="/auth"
          state={{ from: location }}
          onClick={onClose}
          className="block w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-sm text-(--color-success) hover:bg-(--color-success-soft-ui)"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}

AuthAction.propTypes = {
  isAuthenticated: PropTypes.bool.isRequired,
  onSignOut: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
    hash: PropTypes.string,
    state: PropTypes.any,
    key: PropTypes.string,
  }).isRequired,
};

/**
 * Renders the sticky site header with desktop and mobile auth/navigation popovers.
 */
export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const [isDesktopPopoverOpen, setIsDesktopPopoverOpen] = useState(false);
  const [isMobilePopoverOpen, setIsMobilePopoverOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut?.();
      navigate('/auth', { state: { from: location } });
    } catch (error) {
      logger.error('[NAVBAR:SIGN_OUT_FAILED]', error);
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

  const getUsername = () => profile?.username || user?.username || 'User';

  const sharedAuthProps = { isAuthenticated, onSignOut: handleSignOut, location };
  const sharedProfileProps = { profile, user, getUserInitials, getUsername };

  return (
    <nav className="sticky top-3 z-50 h-13 px-8">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between rounded-full border border-(--color-border-strong) bg-(--color-bg-alpha-60) px-6 shadow-sm backdrop-blur-3xl">
        {/* Brand identity remains visible across all breakpoints. */}
        <div className="flex items-center gap-1.5">
          <SiteLogo />
          <SiteName className="font-display text-lg text-(--color-text-primary)" />
        </div>

        {/* Desktop primary links stay outside the popover for faster route switching. */}
        <div className="hidden items-center gap-4 md:flex">
          {navItemsPrimary.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`relative cursor-pointer rounded-lg px-2 py-1 text-sm transition-colors duration-300 ${
                  isActive
                    ? 'text-(--color-dark-brown-hover)'
                    : `text-(--color-text-primary)/60 hover:bg-(--color-warning-soft-ui) hover:text-(--color-text-primary)`
                }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-0.5 w-1/5 -translate-x-1/2 rounded-full bg-(--color-dark-brown-hover)/80" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Auth action and popover triggers live on the right side of the header. */}
        <div className="flex items-center gap-0">
          {!isAuthenticated && (
            <Button variant="ghost" size="sm" as={Link} to="/auth" state={{ from: location }}>
              Sign In
            </Button>
          )}

          {/* Desktop popover carries secondary navigation and authenticated profile actions. */}
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
                {isAuthenticated && <ProfileHeader {...sharedProfileProps} />}
                <SecondaryNavItems
                  isAuthenticated={isAuthenticated}
                  isActivePath={isActivePath}
                  onClose={() => setIsDesktopPopoverOpen(false)}
                />
                <Separator wrapperCn="my-2" />
                <AuthAction {...sharedAuthProps} onClose={() => setIsDesktopPopoverOpen(false)} />
              </div>
            </Popover.Content>
          </Popover>

          {/* Mobile popover combines primary, secondary, and auth actions. */}
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
                {isAuthenticated && <ProfileHeader {...sharedProfileProps} />}

                {/* Primary links move into the popover on mobile. */}
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
                              ? 'bg-(--color-accent-light) text-(--color-dark-brown-primary)'
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

                <SecondaryNavItems
                  isAuthenticated={isAuthenticated}
                  isActivePath={isActivePath}
                  onClose={() => setIsMobilePopoverOpen(false)}
                />
                <Separator wrapperCn="my-2" />
                <AuthAction {...sharedAuthProps} onClose={() => setIsMobilePopoverOpen(false)} />
              </div>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {};

import { Drawer } from '@heroui/react';
import { Link, useLocation } from 'react-router-dom';

import { Button } from '@/components/common';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useAuth } from '@/hooks/useAuth';

export default function MobileNavigationDrawer() {
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { isDrawerOpen, onClose } = useGlobalDrawer();

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
      onClose();
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

  const handleNavigationClick = () => {
    onClose();
  };

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog
            className="w-[50vw]! min-w-fit! data-[placement=right]:w-[50vw]! data-[placement=right]:min-w-fit!"
            data-placement="right"
          >
            <Drawer.CloseTrigger aria-label="Close" />

            <Drawer.Header>
              <Drawer.Heading>Navigation</Drawer.Heading>
            </Drawer.Header>

            <Drawer.Body>
              {isAuthenticated && (
                <div className="mb-5 border-b-[1.5px] border-(--color-border-ui) pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full border border-(--color-border-strong) bg-(--color-accent-light) text-sm font-medium text-(--color-accent)">
                      {getUserInitials()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-(--color-text-primary)">
                        {getUsername()}
                      </p>
                      <p className="text-xs text-(--color-text-muted)">Signed in</p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="space-y-3">
                {navigationItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={handleNavigationClick}
                      className={`block w-full cursor-pointer text-left text-base transition-colors ${
                        isActive
                          ? 'text-(--color-text-primary)'
                          : `text-(--color-text-secondary)/70 hover:text-(--color-text-primary)`
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </Drawer.Body>

            <Drawer.Footer className="*:w-full">
              {isAuthenticated ? (
                <Button size="lg" variant="danger" onClick={handleSignOut}>
                  Sign out
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="ghastly"
                  to="/auth"
                  as={Link}
                  onClick={handleNavigationClick}
                >
                  Sign in
                </Button>
              )}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

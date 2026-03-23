import { Avatar, Dropdown, Separator } from '@heroui/react';
import { HelpCircle, LogOut, Menu, Settings, User, X } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button, SITE_NAME, SiteLogo, SiteName } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  // logger.log('Auth state in Navbar:', { user, profile, isAuthenticated });

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
    { id: 'compare', name: 'Compare Assessments', path: '/assessments/compare' },
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
    { id: 'guide', name: 'Guide', path: '/guide' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut?.();
      navigate('/auth');
    } catch (error) {
      logger.error('Sign out error:', error);
    }
  };

  const userDropdownItems = [
    {
      id: 'profile',
      name: 'My Profile',
      icon: User,
      path: '/profile',
      onClick: () => navigate('/profile'),
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: Settings,
      path: '/settings',
      onClick: () => navigate('/settings'),
    },
    {
      id: 'help',
      name: 'Help & Support',
      icon: HelpCircle,
      path: '/help',
      onClick: () => navigate('/help'),
    },
  ];

  const isActivePath = (path) => {
    const currentPath = location.pathname;

    // 1. If we are checking the 'Compare' link
    if (path === '/assessments/compare') {
      return currentPath.startsWith('/assessments/compare');
    }

    // 2. If we are checking the 'My Assessments' link
    if (path === '/assessments') {
      // Highlight if it starts with /assessments
      // BUT NOT if it's moving into the /compare section
      return (
        currentPath.startsWith('/assessments') && !currentPath.startsWith('/assessments/compare')
      );
    }

    // 3. Default for everything else (Dashboard, Guide, etc.)
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
    const username = profile?.username || user?.username || 'User';
    return username.length > 12 ? username.slice(0, 12) + '...' : username;
  };

  const handleNavigation = (item) => {
    navigate(item.path);
    setIsMenuOpen(false);

    // No special-case toast here; comparison is initiated from My Assessments page
  };

  // Navbar background constant
  const NAVBAR_BG = 'bg-background/70 backdrop-blur-md backdrop-saturate-150';

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 border-b border-default-200',
        NAVBAR_BG,
        'h-16 px-3 xs:px-6 flex items-center justify-between',
      )}
    >
      {/* LEFT: Caret Toggle + SiteLogo + Name + Nav Items */}
      <div className="flex items-center gap-3">
        {/* Caret Toggle - Only visible on mobile */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden cursor-pointer text-foreground"
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="grow-0">
          <button
            onClick={() => {
              navigate('/');
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Go to home"
          >
            <SiteLogo />
            <SiteName className="font-bold text-xl text-foreground" />
          </button>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex justify-start items-start gap-2 ml-4">
          {navigationItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={cn(
                  'text-md font-semibold transition-colors cursor-pointer px-2 py-1 rounded-lg',
                  isActive
                    ? 'text-black bg-default-100'
                    : 'text-foreground/50 hover:text-slate-700/90',
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={cn(
            'md:hidden absolute top-16 left-0 right-0',
            NAVBAR_BG,
            'border-b border-default-200 pt-0 pb-4 px-4',
          )}
        >
          <div className="flex flex-col">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'w-full px-4 py-3 text-left text-xl font-semibold transition-colors rounded-lg cursor-pointer uppercase',
                    isActive
                      ? 'text-black bg-default-100'
                      : 'text-foreground/50 hover:text-slate-700/90 hover:bg-default-50',
                  )}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* RIGHT: Profile Dropdown */}
      <div>
        {isAuthenticated ? (
          <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <Dropdown.Trigger
              className={cn(
                'flex items-center gap-2.5 bg-transparent border-0 focus:outline-none cursor-pointer transition-all duration-200',
              )}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <Avatar color="success" size="md" variant="soft">
                <Avatar.Image src={profile?.avatar_url || user?.avatar_url} alt="User avatar" />
                <Avatar.Fallback className="text-lg font-semibold">
                  {getUserInitials()}
                </Avatar.Fallback>
              </Avatar>
              <span className="hidden xxs:inline text-lg font-medium text-foreground">
                {getUsername()}
              </span>
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu aria-label="User menu">
                {/* User Info Header */}
                <Dropdown.Item className="h-auto p-3 cursor-default">
                  <div className="flex items-center gap-3">
                    <Avatar color="success" size="md" variant="soft">
                      <Avatar.Image
                        src={profile?.avatar_url || user?.avatar_url}
                        alt="User avatar"
                      />
                      <Avatar.Fallback className="text-lg font-semibold">
                        {getUserInitials()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profile?.username || user?.username || 'User'}
                      </p>
                      <p className="text-xs text-foreground truncate">
                        {profile?.username || user?.username || 'User'}@{SITE_NAME}
                      </p>
                    </div>
                  </div>
                </Dropdown.Item>
                <Separator className="my-0" />
                {/* Menu Items */}
                {userDropdownItems.map((item) => (
                  <Dropdown.Item key={item.id} textValue={item.name} onClick={item.onClick}>
                    <div className="flex items-center gap-3">
                      <item.icon className="text-default-500" size={16} />
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                  </Dropdown.Item>
                ))}
                <Separator className="my-0" />
                {/* Sign Out */}
                <Dropdown.Item textValue="Sign Out" onClick={handleSignOut} variant="danger">
                  <div className="flex items-center gap-3">
                    <LogOut size={16} />
                    <span className="font-semibold">Sign Out</span>
                  </div>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        ) : (
          <Button onClick={() => navigate('/auth')} variant="success" className="cursor-pointer">
            Sign In
          </Button>
        )}
      </div>
    </nav>
  );
}

Navbar.propTypes = {};

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common';
import { Avatar, Separator } from '@heroui/react';
import {
  Navbar as HeroNavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
} from '@heroui/navbar';
import { Menu, Transition, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { SITE_CONFIG } from '@/constants/siteConfig';
import { User, Settings, HelpCircle, LogOut, Mail, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  // console.log('Auth state in Navbar:', { user, profile, isAuthenticated });

  const { addToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
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

  const isActivePath = (path) => location.pathname.startsWith(path);

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
    <HeroNavbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="full"
      height="4rem"
      isBlurred
      className="sticky top-0 z-50 border-b border-default-200"
      classNames={{
        base: NAVBAR_BG,
        wrapper: 'px-3 xs:px-6 h-16',
        menu: cn(NAVBAR_BG, 'pt-0 pb-4 px-4 md:hidden'),
      }}
    >
      {/* LEFT: Caret Toggle + SiteLogo + Name + Nav Items */}
      <NavbarContent className="gap-3" justify="start">
        {/* Caret Toggle - Only visible on mobile */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden cursor-pointer text-foreground"
          aria-label="Toggle navigation menu"
        >
          <ChevronDown
            className={cn('w-5 h-5 transition-transform duration-200', isMenuOpen && 'rotate-180')}
          />
        </button>

        <NavbarBrand className="grow-0">
          <button
            onClick={() => {
              navigate('/');
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Go to home"
          >
            <SITE_CONFIG.siteLogo />
            <span className="font-bold text-xl text-foreground">{SITE_CONFIG.name}</span>
          </button>
        </NavbarBrand>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex justify-start items-start gap-2 ml-4">
          {navigationItems.map((item) => {
            const isActive = isActivePath(item.path);
            return (
              <NavbarItem key={item.id} isActive={isActive}>
                <button
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
              </NavbarItem>
            );
          })}
        </div>
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu className="pt-4 flex justify-start flex-col">
        {navigationItems.map((item) => {
          const isActive = isActivePath(item.path);
          return (
            <NavbarMenuItem
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
            </NavbarMenuItem>
          );
        })}
      </NavbarMenu>

      {/* RIGHT: Profile Dropdown */}
      <NavbarContent justify="end">
        <NavbarItem>
          <Menu as="div" className="relative">
            {({ open }) => (
              <>
                <MenuButton
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-transparent',
                    isAuthenticated ? 'cursor-pointer transition-all duration-200' : '',
                  )}
                >
                  {isAuthenticated ? (
                    <>
                      <Avatar color="success" size="md" variant="soft">
                        <Avatar.Image
                          src={profile?.avatar_url || user?.avatar_url}
                          alt="User avatar"
                        />
                        <Avatar.Fallback className="text-lg font-semibold">
                          {getUserInitials()}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className="hidden xxs:inline text-lg font-medium text-foreground">
                        {getUsername()}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-default-500 transition-transform duration-200',
                          open && 'rotate-180',
                        )}
                      />
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate('/auth')}
                      variant="success"
                      className="cursor-pointer"
                    >
                      Sign In
                    </Button>
                  )}
                </MenuButton>

                {isAuthenticated && (
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <MenuItems className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-lg border border-default-200 focus:outline-none overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-default-200">
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
                            <p className="flex items-center gap-1.5 text-xs text-default-500 truncate mt-0.5">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{user?.email || 'user@example.com'}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        {userDropdownItems.map((item) => (
                          <MenuItem key={item.id}>
                            {() => (
                              <button
                                onClick={item.onClick}
                                className={cn(
                                  'flex items-center gap-3 w-full px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-slate-100',
                                )}
                              >
                                <item.icon className="w-4 h-4 text-default-500" />
                                <span className="font-medium text-foreground">{item.name}</span>
                              </button>
                            )}
                          </MenuItem>
                        ))}
                      </div>

                      <Separator className="my-0" />

                      {/* Sign Out */}
                      <div className="py-1">
                        <MenuItem>
                          {() => (
                            <button
                              onClick={handleSignOut}
                              className={cn(
                                'flex items-center gap-3 w-full px-4 py-2 text-sm cursor-pointer transition-colors text-danger hover:bg-red-50',
                              )}
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="font-semibold">Sign Out</span>
                            </button>
                          )}
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </Transition>
                )}
              </>
            )}
          </Menu>
        </NavbarItem>
      </NavbarContent>
    </HeroNavbar>
  );
}

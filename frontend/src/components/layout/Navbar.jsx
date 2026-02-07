import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import Logo from '@/components/common/Logo';
import { Button, Tabs, Dropdown, Label, Separator } from '@heroui/react';
import {
  Home,
  FileText,
  BarChart3,
  GitCompare,
  User,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  Menu,
  Mail,
} from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigation items configuration
  const navigationItems = [
    {
      id: 'home',
      name: 'Home',
      path: '/',
      icon: Home,
    },
    {
      id: 'assessments',
      name: 'My Assessments',
      path: '/assessments',
      icon: FileText,
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
    },
    {
      id: 'compare',
      name: 'Compare',
      path: '/assessments',
      icon: GitCompare,
    },
  ];

  // Get current active tab
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/assessments')) return 'assessments';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/compare') return 'compare';
    return 'home';
  };

  // Get current page display name
  const getCurrentPageName = () => {
    const current = navigationItems.find((item) => item.id === getCurrentTab());
    return current?.name || 'Menu';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    const username = profile?.username || user?.username;
    if (!username) return 'U';
    return username
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle navigation with Compare toast
  const handleNavigation = (item) => {
    navigate(item.path);
    setMobileMenuOpen(false);

    // Show informative toast for Compare navigation
    if (item.id === 'compare') {
      setTimeout(() => {
        addToast('Select exactly 2 assessments to compare', 'info');
      }, 300);
    }
  };

  // Handle tab selection change
  const handleTabChange = (key) => {
    const item = navigationItems.find((nav) => nav.id === key);
    if (item) {
      handleNavigation(item);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      }
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  // Unauthenticated navbar
  if (!isAuthenticated) {
    return (
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="px-4 py-3 mx-auto sm:px-6 lg:px-8 max-w-screen-2xl">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.button
              onClick={() => navigate('/')}
              className="transition-opacity group hover:opacity-80"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Go to home"
            >
              <Logo className="w-10 h-10 drop-shadow-sm" />
            </motion.button>

            {/* Sign In Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => navigate('/auth')}
                className="h-9 gap-2 px-4 text-sm font-semibold text-white transition-all duration-300 shadow-sm rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-md hover:from-emerald-600 hover:to-emerald-700"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>
    );
  }

  // Authenticated navbar with glassmorphic design
  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div className="px-4 py-3.5 mx-auto sm:px-6 lg:px-8 max-w-screen-2xl">
        <div className="flex items-center justify-between gap-4">
          {/* Logo - Left */}
          <motion.button
            onClick={() => navigate('/')}
            className="transition-opacity shrink-0 group hover:opacity-80"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go to home"
          >
            <Logo className="w-10 h-10 drop-shadow-sm" />
          </motion.button>

          {/* Desktop Navigation - Center (Full Tabs) */}
          <div className="absolute hidden transform -translate-x-1/2 left-1/2 md:block">
            <Tabs
              selectedKey={getCurrentTab()}
              onSelectionChange={handleTabChange}
              variant="underlined"
              classNames={{
                tabList: 'gap-1',
                cursor: 'bg-emerald-500',
                tab: 'px-4 py-2 text-sm font-medium',
              }}
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Main navigation">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = getCurrentTab() === item.id;
                    return (
                      <Tabs.Tab
                        key={item.id}
                        id={item.id}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg',
                          !isActive && 'text-gray-700/90 hover:text-gray-900 hover:bg-white/20',
                          isActive && 'text-emerald-700 font-semibold',
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                        <Tabs.Indicator className="h-1 bg-emerald-500 rounded-full shadow-sm" />
                      </Tabs.Tab>
                    );
                  })}
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          </div>

          {/* Mobile Navigation - Dropdown */}
          <div className="absolute transform -translate-x-1/2 left-1/2 md:hidden">
            <Dropdown isOpen={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Dropdown.Trigger>
                <Button
                  variant="flat"
                  className="gap-2 px-3.5 py-2 h-auto font-medium transition-all duration-300 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                  aria-label="Navigation menu"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-700">
                      {getCurrentPageName()}
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-gray-600 transition-transform duration-200',
                        mobileMenuOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Popover
                placement="bottom"
                className="min-w-[220px] rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Dropdown.Menu
                  aria-label="Navigation menu"
                  onAction={(key) => {
                    const item = navigationItems.find((nav) => nav.id === String(key));
                    if (item) handleNavigation(item);
                  }}
                >
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = getCurrentTab() === item.id;
                    return (
                      <Dropdown.Item
                        key={item.id}
                        textValue={item.name}
                        className={cn(
                          'rounded-xl mx-2 my-1 transition-all duration-200',
                          isActive &&
                            'bg-gradient-to-br from-emerald-50 to-emerald-100/50 text-emerald-700 font-semibold',
                          !isActive && 'hover:bg-gray-50',
                        )}
                      >
                        <div className="flex items-center gap-3 py-1.5">
                          <Icon
                            className={cn(
                              'w-4 h-4',
                              isActive ? 'text-emerald-600' : 'text-gray-500',
                            )}
                          />
                          <Label className={isActive ? 'font-semibold' : ''}>{item.name}</Label>
                        </div>
                      </Dropdown.Item>
                    );
                  })}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>

          {/* Avatar Dropdown - Right */}
          <div className="shrink-0">
            <Dropdown isOpen={isDropdownOpen} onOpenChange={toggleDropdown}>
              <Dropdown.Trigger>
                <Button
                  variant="flat"
                  className="gap-2 px-2.5 py-2 h-auto font-medium transition-all duration-300 rounded-full"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  }}
                  aria-label="User menu"
                  onClick={toggleDropdown}
                >
                  <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600">
                    {getUserInitials()}
                  </div>
                  <span className="hidden text-sm font-medium text-gray-700 sm:inline max-w-[120px] truncate">
                    {profile?.username || user?.username || 'User'}
                  </span>
                  <ChevronDown className="hidden w-4 h-4 text-gray-500 sm:inline" />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Popover
                placement="right"
                className="min-w-[260px] rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
                }}
              >
                <Dropdown.Menu
                  aria-label="User menu"
                  onAction={(key) => {
                    if (key === 'signout') {
                      handleSignOut();
                    } else if (key !== 'profile-header') {
                      navigate(`/${key}`);
                    }
                  }}
                  disabledKeys={['profile-header']}
                >
                  {/* User Info Header */}
                  <Dropdown.Item key="profile-header" textValue="User profile">
                    <div className="flex items-center gap-3 py-2 px-1">
                      <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-full shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600">
                        {getUserInitials()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {profile?.username || user?.username || 'User'}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-500 truncate">
                          <Mail className="w-3 h-3" />
                          {user?.email || 'user@example.com'}
                        </p>
                      </div>
                    </div>
                  </Dropdown.Item>

                  <Separator className="my-1.5" />

                  {/* Menu Items */}
                  {/* <Dropdown.Item key="profile" textValue="Profile" className="rounded-xl mx-2 my-1">
                    <div className="flex items-center gap-3 py-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <Label>My Profile</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item
                    key="settings"
                    textValue="Settings"
                    className="rounded-xl mx-2 my-1"
                  >
                    <div className="flex items-center gap-3 py-1">
                      <Settings className="w-4 h-4 text-gray-500" />
                      <Label>Settings</Label>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item key="help" textValue="Help" className="rounded-xl mx-2 my-1">
                    <div className="flex items-center gap-3 py-1">
                      <HelpCircle className="w-4 h-4 text-gray-500" />
                      <Label>Help & Support</Label>
                    </div>
                  </Dropdown.Item> */}

                  {/* <Separator className="my-1.5" /> */}

                  {/* Sign Out */}
                  <Dropdown.Item
                    key="signout"
                    textValue="Sign out"
                    variant="danger"
                    className="rounded-xl mx-2 my-1"
                  >
                    <div className="flex items-center gap-3 py-1">
                      <LogOut className="w-4 h-4" />
                      <Label>Sign Out</Label>
                    </div>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>
      </div>
    </nav>
  );
}

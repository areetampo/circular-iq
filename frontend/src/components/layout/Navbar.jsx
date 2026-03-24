import { Button, Dropdown } from '@heroui/react';
import { HelpCircle, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { SITE_NAME } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigationItems = [
    { id: 'assessments', name: 'My Assessments', path: '/assessments' },
    { id: 'compare', name: 'Compare', path: '/assessments/compare' },
    { id: 'dashboard', name: 'Dashboard', path: '/dashboard' },
  ];

  const userDropdownItems = [
    {
      id: 'assessments',
      name: 'My Assessments',
      icon: User,
      onClick: () => navigate('/assessments'),
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: Settings,
      onClick: () => navigate('/dashboard'),
    },
    {
      id: 'compare',
      name: 'Compare',
      icon: Settings,
      onClick: () => navigate('/assessments/compare'),
    },
    {
      id: 'help',
      name: 'Help & Support',
      icon: HelpCircle,
      onClick: () => navigate('/guide'),
    },
    {
      id: 'signout',
      name: 'Sign Out',
      icon: LogOut,
      onClick: handleSignOut,
      variant: 'danger',
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    if (path === '/assessments/compare') {
      return currentPath.startsWith('/assessments/compare');
    }
    if (path === '/assessments') {
      return (
        currentPath.startsWith('/assessments') && !currentPath.startsWith('/assessments/compare')
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

  const handleNavigation = (item) => {
    navigate(item.path);
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-200',
        isScrolled
          ? 'bg-[oklch(0.97_0.012_80/0.95)] shadow-sm'
          : 'bg-[oklch(0.97_0.012_80/0.82)] backdrop-blur-md',
      )}
      style={{ borderBottomColor: 'var(--border)' }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* LEFT: Logo */}
          <div className="flex items-center">
            <button
              onClick={() => {
                navigate('/');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Go to home"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <span className="text-white text-xs font-bold">⟳</span>
              </div>
              <span
                className="font-serif text-[16px] font-semibold"
                style={{ fontFamily: 'Lora, Georgia, serif', color: 'var(--foreground)' }}
              >
                {SITE_NAME}
              </span>
            </button>
          </div>

          {/* CENTER: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => {
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    'text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'text-[var(--foreground)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)]',
                  )}
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  {item.name}
                </button>
              );
            })}
          </div>

          {/* RIGHT: Auth state */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Desktop User Dropdown */}
                <div className="hidden md:block">
                  <Dropdown isOpen={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <Dropdown.Trigger
                      className="flex items-center gap-2 cursor-pointer transition-colors duration-150"
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent-soft-fg)',
                          fontFamily: 'Lora, Georgia, serif',
                        }}
                      >
                        {getUserInitials()}
                      </div>
                    </Dropdown.Trigger>
                    <Dropdown.Popover>
                      <Dropdown.Menu
                        aria-label="User menu"
                        classNames={{
                          base: 'min-w-[200px]',
                          content: 'p-1',
                        }}
                      >
                        {userDropdownItems.map((item) => (
                          <Dropdown.Item
                            key={item.id}
                            textValue={item.name}
                            onClick={item.onClick}
                            variant={item.variant}
                            classNames={{
                              base: 'gap-3 px-3 py-2',
                              title: 'text-sm font-medium',
                              description: 'text-xs',
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <item.icon
                                size={16}
                                className={
                                  item.variant === 'danger'
                                    ? 'text-[var(--danger)]'
                                    : 'text-[var(--muted)]'
                                }
                              />
                              <span
                                className="font-medium"
                                style={{
                                  color:
                                    item.variant === 'danger'
                                      ? 'var(--danger)'
                                      : 'var(--foreground)',
                                  fontFamily: 'Inter, system-ui, sans-serif',
                                }}
                              >
                                {item.name}
                              </span>
                            </div>
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 hover:bg-[var(--accent-soft)] rounded-md transition-colors"
                  aria-label="Toggle navigation menu"
                >
                  {isMenuOpen ? (
                    <X className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                  ) : (
                    <Menu className="w-5 h-5" style={{ color: 'var(--foreground)' }} />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/auth')}
                  className="text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  Sign In
                </button>
                <Button
                  onClick={() => navigate('/auth')}
                  size="sm"
                  className="text-xs font-medium"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-foreground)',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map((item) => {
                const isActive = isActivePath(item.path);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150',
                      isActive
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-soft-fg)]'
                        : 'text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-soft-fg)]',
                    )}
                    style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                  >
                    {item.name}
                  </button>
                );
              })}

              {isAuthenticated && (
                <>
                  <div className="my-2" style={{ borderTop: '1px solid var(--border)' }} />
                  {userDropdownItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        item.onClick();
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 flex items-center gap-3',
                        item.variant === 'danger'
                          ? 'text-[var(--danger)] hover:bg-[var(--danger-soft)]'
                          : 'text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-soft-fg)]',
                      )}
                      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                    >
                      <item.icon size={16} />
                      {item.name}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

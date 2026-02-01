import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Logo from '@/components/common/Logo';
import { LogOut, User, LayoutDashboard, FileText, GitCompare } from 'lucide-react';

export default function Header({
  showLogo = true,
  title = 'Circular Economy Business Evaluator',
  subtitle = "Evaluate your business idea's circularity potential using AI-driven analysis",
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isAuthenticated, signOut } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    if (!profile?.username) return 'U';
    return profile.username
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          {showLogo && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Logo />
            </button>
          )}
        </div>

        {/* Center: Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/') && 'bg-accent text-accent-foreground',
                  'cursor-pointer'
                )}
                onClick={() => navigate('/')}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </NavigationMenuLink>
            </NavigationMenuItem>

            {isAuthenticated && (
              <>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive('/assessments') && 'bg-accent text-accent-foreground',
                      'cursor-pointer'
                    )}
                    onClick={() => navigate('/assessments')}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    My Assessments
                  </NavigationMenuLink>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive('/comparison') && 'bg-accent text-accent-foreground',
                      'cursor-pointer'
                    )}
                    onClick={() => navigate('/comparison')}
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    Comparison
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right: User Profile / Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative w-10 h-10 rounded-full">
                  <Avatar className="w-10 h-10 border-2 border-primary">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.username || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email || 'user@example.com'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="md:hidden" onClick={() => navigate('/')}>
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem className="md:hidden" onClick={() => navigate('/assessments')}>
                  <FileText className="w-4 h-4 mr-2" />
                  My Assessments
                </DropdownMenuItem>
                <DropdownMenuItem className="md:hidden" onClick={() => navigate('/comparison')}>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Comparison
                </DropdownMenuItem>
                <DropdownMenuSeparator className="md:hidden" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" onClick={() => navigate('/auth')} className="gap-2">
              <User className="w-4 h-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Page Title Section - Displayed below navbar when provided */}
      {(title || subtitle) && (
        <div className="border-t bg-muted/50">
          <div className="container px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="text-center">
              {title && (
                <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="max-w-3xl mx-auto text-lg text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

Header.propTypes = {
  showLogo: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Logo from '@/components/common/Logo';
import useHeaderModals from '@/hooks/useHeaderModals';
import HeaderModalManager from '@/components/modals/header/HeaderModalManager';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  GitCompare,
  BookOpen,
  ClipboardList,
  Leaf,
  Menu,
  X,
  Home,
  Settings,
  HelpCircle,
  Earth,
} from 'lucide-react';

export default function Header({
  // showLogo = true,
  title = 'Circular Economy Business Evaluator',
  subtitle = "Evaluate your business idea's circularity potential using AI-driven analysis",
  // showAssessmentMethodologyButton = true,
  // showEvaluationCriteriaButton = true,
  // showMyAssessmentsButton = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { modal, isModalOpen, onClose, openAssessmentMethodology, openEvaluationCriteria } =
    useHeaderModals();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    if (signOut) {
      await signOut();
    }
    navigate('/auth');
  };

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

  const navigationItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home,
    },
    {
      name: 'Assessments',
      path: '/assessments',
      icon: FileText,
    },
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Earth,
    },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col">
      {/* Enhanced Navbar */}
      <nav className="">
        <div className="mx-auto max-w-screen-2xl">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Logo Section - Left */}
            <div className="flex items-center">
              <motion.button
                onClick={() => navigate('/')}
                className="flex items-center transition-opacity group hover:opacity-80"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Logo />
              </motion.button>
            </div>

            {/* Center Navigation */}
            {isAuthenticated && (
              <div className="absolute hidden transform -translate-x-1/2 left-1/2 sm:block">
                <div className="flex items-center gap-1.5 px-1.5 py-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <motion.div
                        key={item.path}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="ghost"
                          onClick={() => navigate(item.path)}
                          size="sm"
                          className={cn(
                            'gap-2.5 font-medium transition-all duration-300 rounded-xl px-4 h-9 relative overflow-hidden',
                            active
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-slate-800',
                          )}
                        >
                          <Icon className={cn('w-4 h-4', active && 'drop-shadow-sm')} />
                          <span className={cn(active && 'drop-shadow-sm')}>{item.name}</span>
                          {active && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          )}
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* Profile Dropdown - Desktop */}
                  <div className="hidden sm:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant="ghost"
                            className="relative gap-3 font-medium transition-all duration-200 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 h-10 px-3.5 border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                          >
                            <Avatar className="w-8 h-8 border-2 shadow-sm border-green-500/40">
                              <AvatarFallback className="text-xs font-bold text-white bg-gradient-to-br from-green-600 to-emerald-600">
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {profile?.username || user?.username || 'User'}
                            </span>
                          </Button>
                        </motion.div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-64 shadow-lg rounded-xl"
                        align="end"
                        sideOffset={12}
                      >
                        <DropdownMenuLabel className="pb-3">
                          <div className="flex items-center gap-3 p-1">
                            <Avatar className="w-12 h-12 border-2 border-green-500/40">
                              <AvatarFallback className="text-sm font-bold text-white bg-gradient-to-br from-green-600 to-emerald-600">
                                {getUserInitials()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate text-foreground">
                                {profile?.username || user?.username || 'User'}
                              </p>
                              <p className="text-xs truncate text-muted-foreground">
                                {user?.email || `@${profile?.username || 'username'}`}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => navigate('/profile')}
                          className="gap-3 cursor-pointer rounded-lg py-2.5"
                        >
                          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium">Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate('/settings')}
                          className="gap-3 cursor-pointer rounded-lg py-2.5"
                        >
                          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium">Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate('/help')}
                          className="gap-3 cursor-pointer rounded-lg py-2.5"
                        >
                          <HelpCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="font-medium">Help & Support</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="gap-3 text-red-600 cursor-pointer rounded-lg py-2.5 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">Sign Out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Mobile Menu Toggle */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileMenuOpen(true)}
                      className="w-10 h-10 transition-all duration-200 border border-transparent sm:hidden hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl hover:border-gray-200 dark:hover:border-slate-700"
                      aria-label="Toggle menu"
                    >
                      <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </Button>
                  </motion.div>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => navigate('/auth')}
                    className="h-10 gap-2 px-5 font-semibold text-white transition-all duration-200 shadow-sm rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg hover:from-green-700 hover:to-emerald-700"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Sheet */}
      {isAuthenticated && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="right" className="w-[300px] p-0 bg-background">
            <VisuallyHidden>
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>
                  Access your profile and navigate through the application
                </SheetDescription>
              </SheetHeader>
            </VisuallyHidden>
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="px-6 py-6 border-b bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-900 dark:to-slate-800">
                <div className="flex items-center gap-3">
                  <Avatar className="border-2 shadow-md w-14 h-14 border-green-500/40">
                    <AvatarFallback className="text-base font-bold text-white bg-gradient-to-br from-green-600 to-emerald-600">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate">
                      {profile?.username || user?.username || 'User'}
                    </p>
                    <p className="text-xs truncate text-muted-foreground">
                      {user?.email || `@${profile?.username || 'username'}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation Items */}
              <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                <div className="mb-4">
                  <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Navigation
                  </p>
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Button
                        key={item.path}
                        variant={active ? 'default' : 'ghost'}
                        onClick={() => handleNavigation(item.path)}
                        className={cn(
                          'w-full justify-start gap-3 h-11 rounded-lg font-medium mb-1',
                          active
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-slate-800',
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.name}
                      </Button>
                    );
                  })}
                </div>

                <div className="pt-4 space-y-1.5 border-t">
                  <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                    Account
                  </p>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/profile')}
                    className="justify-start w-full gap-3 font-medium text-gray-700 rounded-lg h-11 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <User className="w-5 h-5" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/settings')}
                    className="justify-start w-full gap-3 font-medium text-gray-700 rounded-lg h-11 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigation('/help')}
                    className="justify-start w-full gap-3 font-medium text-gray-700 rounded-lg h-11 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Help & Support
                  </Button>
                </div>
              </div>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t bg-gray-50 dark:bg-slate-900">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="justify-start w-full h-12 gap-3 font-medium text-red-600 border-red-200 shadow-sm rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-900/30 dark:hover:bg-red-950/20"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Enhanced Hero Section */}
      {(title || subtitle) && (
        <div className="relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <motion.div
              className="absolute rounded-full -top-40 -right-40 w-96 h-96 blur-3xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute rounded-full -bottom-40 -left-40 w-96 h-96 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <div className="container relative px-4 py-6 mx-auto sm:py-10 lg:py-20 max-w-7xl sm:px-6 lg:px-8">
            <div className="space-y-10">
              {/* Title Section */}
              <div className="space-y-6 text-center">
                {title && (
                  <motion.h1
                    className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <span className="font-extrabold text-transparent bg-gradient-to-r from-green-700 via-emerald-500 to-teal-700 bg-clip-text">
                      {title}
                    </span>
                  </motion.h1>
                )}

                {subtitle && (
                  <motion.p
                    className="max-w-xl mx-auto text-lg leading-relaxed text-gray-700 sm:text-xl md:text-2xl dark:text-gray-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={openAssessmentMethodology}
                    size="lg"
                    className="gap-2.5 font-semibold text-white transition-all duration-200 shadow-lg rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-xl px-8 h-12"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Assessment Methodology</span>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={openEvaluationCriteria}
                    size="lg"
                    variant="outline"
                    className="gap-2.5 font-semibold transition-all duration-200 border-2 shadow-md rounded-xl border-green-600/40 bg-white hover:bg-green-50 dark:bg-slate-900 dark:border-green-800/60 dark:hover:bg-green-950/20 hover:shadow-lg px-8 h-12"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span>Evaluation Criteria</span>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Header Modals */}
      <HeaderModalManager modal={modal} isModalOpen={isModalOpen} onClose={onClose} />
    </div>
  );
}

Header.propTypes = {
  showLogo: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

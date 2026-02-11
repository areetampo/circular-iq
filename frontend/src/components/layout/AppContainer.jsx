import React from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import Navbar from './Navbar';
import Header from './Header';
import Footer from './Footer';

/**
 * Route-based container configuration
 * Each route can have different background styling, animated elements, and layout visibility
 */
const CONTAINER_CONFIGS = [
  {
    path: '/',
    exact: true,
    background: 'from-green-300/30 via-emerald-300/30 to-teal-300/30',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-6',
    // Animated background blobs
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-emerald-300/40',
        position: '-left-20 -top-20',
        size: 'w-96 h-96',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], duration: 10 },
      },
      {
        color: 'bg-teal-300/40',
        position: '-right-20 top-1/3',
        size: 'w-96 h-96',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], duration: 12 },
      },
      {
        color: 'bg-cyan-300/40',
        position: 'bottom-0 left-1/3',
        size: 'w-96 h-96',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2], duration: 8 },
      },
    ],
  },
  {
    path: '/dashboard',
    background: 'from-blue-300/25 via-cyan-300/25 to-teal-300/25',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-6',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-cyan-300/35',
        position: '-left-20 top-1/4',
        size: 'w-96 h-96',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3], duration: 9 },
      },
      {
        color: 'bg-blue-300/25',
        position: 'bottom-1/3 -right-20',
        size: 'w-80 h-80',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2], duration: 11 },
      },
    ],
  },
  {
    path: '/results',
    exact: true,
    background: 'from-emerald-300/25 via-green-300/25 to-teal-300/25',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-6',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-emerald-300/30',
        position: 'top-1/3 -left-20',
        size: 'w-80 h-80',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25], duration: 8 },
      },
      {
        color: 'bg-teal-300/25',
        position: 'bottom-1/4 -right-20',
        size: 'w-72 h-72',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], duration: 10 },
      },
    ],
  },
  {
    path: '/assessments',
    exact: true,
    background: 'from-purple-300/25 via-violet-300/25 to-indigo-300/25',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-6',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-violet-300/30',
        position: 'top-1/3 -left-20',
        size: 'w-80 h-80',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25], duration: 8 },
      },
      {
        color: 'bg-purple-300/25',
        position: 'bottom-1/3 -right-20',
        size: 'w-72 h-72',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2], duration: 10 },
      },
    ],
  },
  {
    path: '/assessments/',
    regex: /^\/assessments\/[^/]+$/,
    background: 'from-emerald-200/20 via-green-200/20 to-teal-200/20',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-4 sm:p-6',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-emerald-200/25',
        position: 'top-1/4 -left-20',
        size: 'w-72 h-72',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2], duration: 7 },
      },
      {
        color: 'bg-teal-200/20',
        position: 'bottom-1/3 -right-20',
        size: 'w-64 h-64',
        blur: 'blur-xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], duration: 9 },
      },
    ],
  },
  {
    path: '/compare',
    background: 'from-orange-300/25 via-amber-300/25 to-yellow-300/25',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-6',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-amber-300/30',
        position: 'top-1/3 -left-20',
        size: 'w-80 h-80',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25], duration: 8 },
      },
      {
        color: 'bg-orange-300/25',
        position: 'bottom-1/4 -right-20',
        size: 'w-72 h-72',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], duration: 10 },
      },
    ],
  },
  {
    path: '/results/',
    regex: /^\/results\/[^/]+\/market-analysis$/,
    background: 'from-blue-200/20 via-indigo-200/20 to-purple-200/20',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-4 sm:p-6',
    showAnimatedBg: false, // Minimal distraction for data-heavy page
    blobs: [],
  },
  {
    path: '/auth',
    background: 'from-emerald-300/25 via-green-300/25 to-teal-300/25',
    showNavbar: true, // Hide navbar on auth page
    showHeader: true,
    showFooter: false, // Hide footer on auth page
    mainPadding: 'p-8 sm:p-12',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-emerald-300/30',
        position: 'top-1/4 -left-20',
        size: 'w-80 h-80',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25], duration: 8 },
      },
      {
        color: 'bg-green-300/25',
        position: 'bottom-1/3 -right-20',
        size: 'w-72 h-72',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2], duration: 10 },
      },
    ],
  },
  // Default fallback
  {
    path: '*',
    background: 'from-green-300/30 via-emerald-300/30 to-teal-300/30',
    showNavbar: true,
    showHeader: true,
    showFooter: true,
    mainPadding: 'p-6',
    showAnimatedBg: true,
    blobs: [
      {
        color: 'bg-emerald-300/35',
        position: '-left-20 top-1/4',
        size: 'w-80 h-80',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3], duration: 9 },
      },
      {
        color: 'bg-teal-300/30',
        position: 'bottom-1/3 -right-20',
        size: 'w-72 h-72',
        blur: 'blur-2xl',
        animation: { scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2], duration: 11 },
      },
    ],
  },
];

/**
 * Get container configuration for current route
 * @param {string} pathname - Current route pathname
 * @returns {Object} Container configuration object
 */
const getContainerConfig = (pathname) => {
  // Try exact match first
  const exactMatch = CONTAINER_CONFIGS.find((config) => config.exact && config.path === pathname);
  if (exactMatch) return exactMatch;

  // Try regex match
  const regexMatch = CONTAINER_CONFIGS.find(
    (config) => config.regex && config.regex.test(pathname),
  );
  if (regexMatch) return regexMatch;

  // Try prefix match (for dynamic routes)
  const prefixMatch = CONTAINER_CONFIGS.find(
    (config) =>
      !config.exact && !config.regex && pathname.startsWith(config.path) && config.path !== '*',
  );
  if (prefixMatch) return prefixMatch;

  // Return default fallback
  return CONTAINER_CONFIGS.find((config) => config.path === '*');
};

/**
 * Main application container with route-based styling
 * Automatically detects route and applies appropriate configuration
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showNavbar] - Override navbar visibility
 * @param {boolean} [props.showHeader] - Override header visibility
 * @param {boolean} [props.showFooter] - Override footer visibility
 */
export default function AppContainer({
  children,
  className = '',
  showNavbar: showNavbarOverride,
  showHeader: showHeaderOverride,
  showFooter: showFooterOverride,
}) {
  const location = useLocation();
  const config = getContainerConfig(location.pathname);

  // Use override props if provided, otherwise use config values
  const showNavbar = showNavbarOverride ?? config.showNavbar;
  const showHeader = showHeaderOverride ?? config.showHeader;
  const showFooter = showFooterOverride ?? config.showFooter;

  return (
    <div className={cn('relative min-h-screen flex flex-col bg-linear-to-br', config.background)}>
      {/* Navbar */}
      {showNavbar && <Navbar />}
      <div className={cn('relative', config.mainPadding, className)}>
        {/* Animated background circles for circular economy theme */}
        {config.showAnimatedBg && config.blobs.length > 0 && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {config.blobs.map((blob, index) => (
              <motion.div
                key={index}
                className={cn(
                  'absolute rounded-full',
                  blob.position,
                  blob.size,
                  blob.blur,
                  blob.color,
                )}
                animate={{
                  scale: blob.animation.scale,
                  opacity: blob.animation.opacity,
                }}
                transition={{
                  duration: blob.animation.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        {showHeader && <Header />}

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          <div className="container mx-auto max-w-7xl px-0 py-0 mb-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

AppContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  showNavbar: PropTypes.bool,
  showHeader: PropTypes.bool,
  showFooter: PropTypes.bool,
};

import React from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Route-based header configuration
 * Each route can have different styling, sizing, visibility, and content
 */
const ROUTE_CONFIGS = [
  {
    path: '/',
    exact: true,
    title: 'Circular Economy Business Evaluator',
    subtitle: 'Assess and enhance your circular economy business ideas with AI-driven insights.',
    titleSize: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl', // Largest - hero page
    subtitleSize: 'text-lg md:text-xl lg:text-2xl',
    titleColor: 'from-green-700 via-emerald-500 to-teal-700',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-6 sm:py-10 lg:py-20',
    // Animated background blobs
    showAnimatedBg: true,
    bgBlob1Color: 'bg-emerald-300/30',
    bgBlob2Color: 'bg-green-300/20',
    bgOpacity: 'opacity-40',
    bgAnimation: { duration1: 8, duration2: 10 }, // Slower, more majestic
  },
  {
    path: '/dashboard',
    title: 'Global Dashboard',
    subtitle: 'Track circular economy performance across all assessments.',
    titleSize: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl', // Large
    subtitleSize: 'text-base md:text-lg lg:text-xl',
    titleColor: 'from-blue-700 via-cyan-600 to-teal-600',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-5 sm:py-8 lg:py-12',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-cyan-300/30',
    bgBlob2Color: 'bg-blue-300/20',
    bgOpacity: 'opacity-35',
    bgAnimation: { duration1: 7, duration2: 9 },
  },
  {
    path: '/results',
    exact: true,
    title: 'Circularity Assessment Results',
    subtitle: "AI-powered evaluation of your business idea's circular economy potential",
    titleSize: 'text-3xl sm:text-4xl md:text-5xl', // Medium-large
    subtitleSize: 'text-base md:text-lg',
    titleColor: 'from-emerald-700 via-green-600 to-teal-600',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-4 sm:py-6 lg:py-10',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-emerald-300/25',
    bgBlob2Color: 'bg-teal-300/20',
    bgOpacity: 'opacity-30',
    bgAnimation: { duration1: 6, duration2: 8 },
  },
  {
    path: '/assessments',
    exact: true,
    title: 'My Assessments',
    subtitle: 'Review and manage your saved circularity evaluations.',
    titleSize: 'text-3xl sm:text-4xl md:text-5xl', // Medium-large
    subtitleSize: 'text-base md:text-lg',
    titleColor: 'from-purple-700 via-violet-600 to-indigo-600',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-4 sm:py-6 lg:py-10',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-violet-300/25',
    bgBlob2Color: 'bg-purple-300/20',
    bgOpacity: 'opacity-30',
    bgAnimation: { duration1: 6, duration2: 8 },
  },
  {
    path: '/assessments/',
    regex: /^\/assessments\/[^/]+$/,
    title: 'Assessment Details',
    subtitle: 'Detailed view of your circular economy assessment',
    titleSize: 'text-2xl sm:text-3xl md:text-4xl', // Medium
    subtitleSize: 'text-sm md:text-base',
    titleColor: 'from-emerald-600 via-green-500 to-teal-500',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-4 sm:py-6 lg:py-8',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-emerald-200/20',
    bgBlob2Color: 'bg-teal-200/15',
    bgOpacity: 'opacity-25',
    bgAnimation: { duration1: 5, duration2: 7 }, // Faster, subtle
  },
  {
    path: '/compare',
    title: 'Assessment Comparison',
    subtitle: 'Compare two assessments side-by-side to track progress and identify improvements.',
    titleSize: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl', // Medium-large
    subtitleSize: 'text-sm md:text-base lg:text-lg',
    titleColor: 'from-orange-700 via-amber-600 to-yellow-600',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-4 sm:py-6 lg:py-10',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-amber-300/25',
    bgBlob2Color: 'bg-orange-300/20',
    bgOpacity: 'opacity-30',
    bgAnimation: { duration1: 6, duration2: 8 },
  },
  {
    path: '/results/',
    regex: /^\/results\/[^/]+\/market-analysis$/,
    title: 'Market Analysis',
    subtitle: 'Competitive benchmarking and market positioning insights',
    titleSize: 'text-xl sm:text-2xl md:text-3xl', // Smaller
    subtitleSize: 'text-xs md:text-sm',
    titleColor: 'from-blue-600 via-indigo-500 to-purple-500',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-3 sm:py-4 lg:py-6',
    showAnimatedBg: false, // Minimal distraction for data-heavy page
    bgBlob1Color: '',
    bgBlob2Color: '',
    bgOpacity: 'opacity-20',
    bgAnimation: { duration1: 5, duration2: 7 },
  },
  {
    path: '/auth',
    title: 'Welcome Back',
    subtitle: 'Sign in to access your circular economy assessments',
    titleSize: 'text-3xl sm:text-4xl md:text-5xl',
    subtitleSize: 'text-base md:text-lg',
    titleColor: 'from-emerald-700 via-green-600 to-teal-600',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-4 sm:py-6 lg:py-10',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-emerald-300/30',
    bgBlob2Color: 'bg-green-300/20',
    bgOpacity: 'opacity-30',
    bgAnimation: { duration1: 6, duration2: 8 },
  },
  // Default fallback
  {
    path: '*',
    title: 'Circular Economy Business Evaluator',
    subtitle: "Evaluate your business idea's circularity potential using AI-driven analysis",
    titleSize: 'text-3xl sm:text-4xl md:text-5xl',
    subtitleSize: 'text-base md:text-lg',
    titleColor: 'from-green-700 via-emerald-500 to-teal-700',
    showTitle: true,
    showSubtitle: true,
    padding: 'py-4 sm:py-6 lg:py-10',
    showAnimatedBg: true,
    bgBlob1Color: 'bg-emerald-300/30',
    bgBlob2Color: 'bg-green-300/20',
    bgOpacity: 'opacity-30',
    bgAnimation: { duration1: 6, duration2: 8 },
  },
];

/**
 * Find matching route configuration based on current pathname
 */
const getRouteConfig = (pathname) => {
  // Try exact match first
  const exactMatch = ROUTE_CONFIGS.find((config) => config.exact && config.path === pathname);
  if (exactMatch) return exactMatch;

  // Try regex match
  const regexMatch = ROUTE_CONFIGS.find((config) => config.regex && config.regex.test(pathname));
  if (regexMatch) return regexMatch;

  // Try prefix match (for dynamic routes)
  const prefixMatch = ROUTE_CONFIGS.find(
    (config) =>
      !config.exact && !config.regex && pathname.startsWith(config.path) && config.path !== '*',
  );
  if (prefixMatch) return prefixMatch;

  // Return default fallback
  return ROUTE_CONFIGS.find((config) => config.path === '*');
};

export default function Header({ title: titleOverride, subtitle: subtitleOverride }) {
  const location = useLocation();
  const config = getRouteConfig(location.pathname);

  // Use override props if provided, otherwise use config values
  const title = titleOverride ?? config.title;
  const subtitle = subtitleOverride ?? config.subtitle;

  // Don't render if config says to hide both title and subtitle
  if (!config.showTitle && !config.showSubtitle) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {(title || subtitle) && (
        <div className="relative overflow-hidden">
          {/* Animated Background Elements */}
          {config.showAnimatedBg && (
            <div
              className={`absolute inset-0 overflow-hidden pointer-events-none ${config.bgOpacity}`}
            >
              <motion.div
                className={`absolute rounded-full -top-40 -right-40 w-96 h-96 blur-3xl ${config.bgBlob1Color}`}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: config.bgAnimation.duration1,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className={`absolute rounded-full -bottom-40 -left-40 w-96 h-96 blur-3xl ${config.bgBlob2Color}`}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: config.bgAnimation.duration2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          )}

          <div
            className={`container relative px-4 mx-auto max-w-7xl sm:px-6 lg:px-8 ${config.padding}`}
          >
            <div className="space-y-10">
              {/* Title Section */}
              <div className="space-y-6 text-center">
                {title && config.showTitle && (
                  <motion.h1
                    className={`${config.titleSize} font-bold leading-none tracking-tight`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <span
                      className={`leading-none font-extrabold text-transparent bg-linear-to-r ${config.titleColor} bg-clip-text`}
                    >
                      {title}
                    </span>
                  </motion.h1>
                )}

                {subtitle && config.showSubtitle && (
                  <motion.p
                    className={`mx-auto ${config.subtitleSize} leading-relaxed text-gray-700 dark:text-gray-300 max-w-[85%]`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    {subtitle}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Header.propTypes = {
  showLogo: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

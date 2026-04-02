import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { SITE_FULL_NAME, SITE_NAME, SiteLogo } from '@/components/common/Brand';
import { cn } from '@/utils/cn';

const footerLinks = [
  { name: 'Assessments', href: '/assessments' },
  { name: 'Share', href: '/assessments/share' },
  { name: 'Compare', href: '/assessments/compare' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Guide', href: '/guide' },
];

const socialLinks = [
  {
    name: 'GitHub',
    icon: 'fi fi-brands-github',
    url: 'https://github.com/areetampo/circular-economy',
  },
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="relative mt-auto border-t-2 border-(--color-border) bg-(--color-bg)">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-(--color-bg) to-(--color-bg) opacity-90" />

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 xs_sm:grid-cols-2 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <SiteLogo className="transition-transform duration-300 group-hover:scale-105" />
                <div className="flex flex-col">
                  <span className="font-(--font-display) text-lg text-(--color-text-primary)">
                    {SITE_NAME}
                  </span>
                  <span className="text-xs text-(--color-text-muted) font-(--font-body)">
                    {SITE_FULL_NAME}
                  </span>
                </div>
              </div>

              <p className="text-sm text-(--color-text-secondary) leading-relaxed max-w-xs">
                AI-powered circular economy evaluation platform. Get evidence-backed scores in
                seconds.
              </p>

              <div className="flex flex-col items-start gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className="text-(--color-text-muted) hover:text-(--color-accent) transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <i className={cn(social.icon, 'text-xl')}></i>
                  </a>
                ))}
                <p className="text-xs italic text-(--color-text-secondary) leading-relaxed max-w-xs">
                  ~ Made by Areeb and Mahit UwU ~
                </p>
              </div>
            </motion.div>

            {/* Navigation Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="space-y-4 xs_sm:ml-8"
            >
              <h3 className="text-sm font-(--font-body) text-(--color-text-primary) uppercase tracking-wider">
                Navigation
              </h3>
              <nav className="space-y-2">
                {footerLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => navigate(link.href)}
                    className={cn(
                      'block text-sm text-(--color-text-muted) hover:text-(--color-accent)',
                      'transition-colors duration-200 text-left',
                      'hover:translate-x-1 transform',
                    )}
                  >
                    {link.name}
                  </button>
                ))}
              </nav>
            </motion.div>

            {/* Platform Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="space-y-4"
            >
              <h3 className="text-sm font-(--font-body) text-(--color-text-primary) uppercase tracking-wider">
                Platform
              </h3>
              <div className="space-y-2 text-sm text-(--color-text-muted)">
                <p>40,000+ real-world cases</p>
                <p>Evidence-based scoring</p>
                <p>AI-powered analysis</p>
                <p>Multi-dimensional evaluation</p>
              </div>

              <div className="pt-2">
                <p className="text-xs text-(--color-text-muted) italic">
                  &ldquo;Where circular economy meets evidence.&rdquo;
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="mt-12 pt-8 border-t-2 border-(--color-border)"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-(--color-text-muted) font-(--font-body)">
                © 2026 {SITE_FULL_NAME}. All rights reserved.
              </p>

              <div className="flex items-center gap-6 text-xs text-(--color-text-muted)">
                <span className="font-(--font-body)">
                  AI-Powered · Evidence-Based · Circular Economy
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

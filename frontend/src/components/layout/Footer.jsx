import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { SITE_FULL_NAME, SiteFullName, SiteLogo, SiteName } from '@/components/common/Brand';
import { cn } from '@/utils/cn';

const footerLinks = [
  { name: 'My Assessments', href: '/assessments' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Guide', href: '/guide' },
  { name: 'Share', href: '/assessments/share' },
  { name: 'Compare', href: '/assessments/compare' },
];

const socialLinks = [
  {
    name: 'GitHub',
    icon: 'fi fi-brands-github',
    url: 'https://github.com/areetampo/circular-economy',
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t-2 border-black/10">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-(--color-bg) to-(--color-bg) opacity-90" />

      <div className="relative z-10">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="grid grid-cols-1 gap-8 xs_sm:grid-cols-2 md:grid-cols-3">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="group flex items-center gap-3">
                <SiteLogo />
                <div className="flex flex-col">
                  <div>
                    <SiteName className="font-display text-lg text-(--color-text-primary)" />
                  </div>
                  <SiteFullName className="font-sans text-xs text-(--color-text-muted)" />
                </div>
              </div>

              <p className="max-w-xs text-sm/relaxed text-(--color-text-secondary)">
                AI-powered circular economy evaluation platform. Get evidence-backed scores in
                seconds.
              </p>

              <div className="flex flex-col items-start gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    className="text-(--color-text-muted) transition-colors duration-200 hover:text-(--color-accent)"
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i className={cn(social.icon, 'text-xl')}></i>
                  </a>
                ))}
                <p className="max-w-xs text-xs/relaxed text-(--color-text-secondary) italic">
                  ~ Made by Areeb and Mahit ~
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
              <h3 className="font-sans text-sm tracking-wider text-(--color-text-primary) uppercase">
                Navigation
              </h3>
              <nav className="space-y-2">
                {footerLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      `block text-sm text-(--color-text-muted) hover:text-(--color-accent)`,
                      'text-left transition-all duration-200',
                      `transform cursor-pointer hover:translate-x-1`,
                    )}
                  >
                    {link.name}
                  </Link>
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
              <h3 className="font-sans text-sm tracking-wider text-(--color-text-primary) uppercase">
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
            className="mt-4"
          >
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <p className="font-sans text-xs text-(--color-text-muted)">
                © 2026 {SITE_FULL_NAME}. All rights reserved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}

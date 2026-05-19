/**
 * @module GuideNav
 * @description Sticky sidebar and mobile TOC for the Guide page; scroll-synced via section ids.
 */

import { ScrollShadow } from '@heroui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';
import React, { useEffect, useRef } from 'react';

import { cn } from '@/utils/cn';

import { NAV_TREE } from '../constants/navTree';

/**
 * Single nav link (top-level section or child anchor).
 *
 * @param {Object} props
 * @param {{ id: string, label: string, children?: Array }} props.item - Nav node.
 * @param {'top'|'sub'} props.level - Indent level.
 * @param {string} props.activeId - Currently highlighted section id.
 * @param {(id: string) => void} props.onNavigate - Scroll handler.
 * @returns {import('react').ReactElement}
 */
function NavItem({ item, level, activeId, onNavigate }) {
  const isActive = activeId === item.id;
  return (
    <button
      data-id={item.id}
      onClick={() => onNavigate(item.id)}
      className={cn(
        'relative flex w-full cursor-pointer items-center text-left transition-colors duration-150',
        level === 'top' ? 'py-1 pl-4 text-sm font-medium' : 'py-0.5 pl-7 text-[0.8rem] font-normal',
        isActive
          ? 'font-semibold text-(--color-text-primary)'
          : 'text-(--color-text-muted) hover:text-(--color-text-secondary)',
      )}
    >
      {isActive && (
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-(--color-accent)" />
      )}
      {item.label}
    </button>
  );
}

const navItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
});

NavItem.propTypes = {
  item: navItemShape.isRequired,
  level: PropTypes.oneOf(['top', 'sub']).isRequired,
  activeId: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

/**
 * Collapsible mobile table of contents (lg:hidden).
 *
 * @param {Object} props
 * @param {string} props.activeId - Highlighted nav id.
 * @param {boolean} props.mobileOpen - Whether the drawer is expanded.
 * @param {Function} props.setMobileOpen - Toggle mobile nav open state.
 * @param {(id: string) => void} props.scrollToId - Scroll to section handler.
 * @returns {import('react').ReactElement}
 */
export function MobileNav({ activeId, mobileOpen, setMobileOpen, scrollToId }) {
  const navRef = React.useRef(null);

  useEffect(() => {
    if (!navRef.current || !mobileOpen) return;
    const activeEl = navRef.current.querySelector(`[data-id="${activeId}"]`);
    if (!activeEl) return;

    const container = navRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const padding = 40;

    if (itemRect.bottom > containerRect.bottom - padding) {
      container.scrollTo({
        top: container.scrollTop + itemRect.bottom - containerRect.bottom + padding,
        behavior: 'smooth',
      });
    } else if (itemRect.top < containerRect.top + padding) {
      container.scrollTo({
        top: container.scrollTop - (containerRect.top - itemRect.top + padding),
        behavior: 'smooth',
      });
    }
  }, [activeId, mobileOpen]);

  const getCurrentSectionLabel = () => {
    for (const section of NAV_TREE) {
      if (section.id === activeId) return section.label;
      const child = section.children?.find((c) => c.id === activeId);
      if (child) return `${section.label} / ${child.label}`;
    }
    return 'Overview';
  };

  const handleMobileNavClick = (id) => {
    setMobileOpen(false);
    // Small delay to let the menu close animation finish before scrolling
    setTimeout(() => scrollToId(id), 50);
  };

  return (
    <div className="sticky top-20 right-4 z-20 mt-6 flex w-full justify-end">
      <div className="min-w-2/5 rounded-xl border border-(--color-border-ui) bg-(--color-bg) shadow-lg lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-(--color-text-primary)"
        >
          <span
            className="min-w-0 flex-1 truncate text-left text-sm"
            style={{ fontSize: 'clamp(0.65rem, 2.5vw, 0.875rem)' }}
          >
            {getCurrentSectionLabel()}
          </span>
          {mobileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {mobileOpen && (
          <div
            className={cn(
              'overflow-hidden border-t border-(--color-border-ui) transition-none',
              mobileOpen ? 'max-h-72' : 'max-h-0 border-t-0',
            )}
          >
            <div
              ref={navRef}
              className="scrollbar-hide overflow-y-auto bg-(--color-bg) px-4 py-2 pb-4"
              style={{
                maxHeight: '18rem',
                maskImage:
                  'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
              }}
            >
              {NAV_TREE.map((section) => (
                <React.Fragment key={section.id}>
                  <NavItem
                    item={section}
                    level="top"
                    activeId={activeId}
                    onNavigate={handleMobileNavClick}
                  />
                  {section.children?.map((child) => (
                    <div key={child.id} className="ml-3 border-l border-(--color-border-faint)">
                      <NavItem
                        item={child}
                        level="sub"
                        activeId={activeId}
                        onNavigate={handleMobileNavClick}
                      />
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

MobileNav.propTypes = {
  activeId: PropTypes.string.isRequired,
  mobileOpen: PropTypes.bool.isRequired,
  setMobileOpen: PropTypes.func.isRequired,
  scrollToId: PropTypes.func.isRequired,
};

/**
 * Sticky desktop sidebar TOC (hidden below lg breakpoint).
 *
 * @param {Object} props
 * @param {string} props.activeId - Highlighted nav id.
 * @param {(id: string) => void} props.onNavigate - Scroll to section handler.
 * @returns {import('react').ReactElement}
 */
export function DesktopNav({ activeId, onNavigate }) {
  // Add a ref to the scroll container
  const navRef = useRef(null);

  // Scroll the active nav item into view whenever activeId changes
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector(`[data-id="${activeId}"]`);
    if (!activeEl) return;

    const container = navRef.current;
    const containerRect = container.getBoundingClientRect();
    const itemRect = activeEl.getBoundingClientRect();
    const padding = 40;

    if (itemRect.bottom > containerRect.bottom - padding) {
      container.scrollTo({
        top: container.scrollTop + itemRect.bottom - containerRect.bottom + padding,
        behavior: 'smooth',
      });
    } else if (itemRect.top < containerRect.top + padding) {
      container.scrollTo({
        top: container.scrollTop - (containerRect.top - itemRect.top + padding),
        behavior: 'smooth',
      });
    }
  }, [activeId]);

  return (
    <nav className="-mt-10 hidden w-52 shrink-0 lg:block">
      <div className="sticky top-40">
        <p className="mb-3 font-rough text-sm font-bold tracking-[0.14em] text-(--color-text-muted) uppercase">
          On this page
        </p>
        {/*
          Scroll container: fixed max-height, hidden scrollbar, CSS fade shadows.
          The mask-image creates the top/bottom fade effect that HeroUI ScrollShadow provides.
          It fades from transparent at top/bottom edges to fully visible in the middle.
        */}
        <ScrollShadow ref={navRef} className="scrollbar-hide max-h-105" hideScrollBar size={40}>
          <div className="border-l border-(--color-border-ui) pt-2 pb-10">
            {NAV_TREE.map((section) => (
              <React.Fragment key={section.id}>
                <NavItem item={section} level="top" activeId={activeId} onNavigate={onNavigate} />
                {section.children?.map((child) => (
                  <NavItem
                    key={child.id}
                    item={child}
                    level="sub"
                    activeId={activeId}
                    onNavigate={onNavigate}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </ScrollShadow>
      </div>
    </nav>
  );
}

DesktopNav.propTypes = {
  activeId: PropTypes.string.isRequired,
  onNavigate: PropTypes.func.isRequired,
};

/**
 * @module useGuideScrollSpy
 * @description Intersection-observer scroll spy and smooth scroll for the Guide page TOC.
 * Observes child subsection anchors (not parent sections) to avoid flicker when scrolling.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { NAV_TREE } from '../constants/navTree';

const SCROLL_LOCK_MS = 900;
const HEADER_OFFSET_PX = 80;

/**
 * Tracks active guide section while scrolling and provides `scrollToId` for nav clicks.
 *
 * @returns {{
 *   activeId: string,
 *   mobileOpen: boolean,
 *   setMobileOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>,
 *   scrollToId: (id: string) => void
 * }}
 */
export default function useGuideScrollSpy() {
  const [activeId, setActiveId] = useState('overview');
  const [mobileOpen, setMobileOpen] = useState(false);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const childIds = NAV_TREE.flatMap((s) => s.children?.map((c) => c.id) ?? []);
    const parentIds = NAV_TREE.map((s) => s.id);
    const allObservedIds = [...childIds];
    const elements = allObservedIds.map((id) => document.getElementById(id)).filter(Boolean);

    if (elements.length === 0) return;

    const intersecting = new Set();

    const pickActive = () => {
      if (intersecting.size === 0) {
        const viewportMid = window.scrollY + window.innerHeight * 0.3;
        let bestParent = parentIds[0];
        for (const id of parentIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= viewportMid) bestParent = id;
        }
        setActiveId(bestParent);
        return;
      }

      const priorityOrder = NAV_TREE.flatMap((s) => s.children?.map((c) => c.id) ?? []);
      for (const id of priorityOrder) {
        if (intersecting.has(id)) {
          setActiveId(id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) intersecting.add(entry.target.id);
          else intersecting.delete(entry.target.id);
        });
        if (!isScrollingRef.current) pickActive();
      },
      { rootMargin: '-12% 0px -30% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      intersecting.clear();
    };
  }, []);

  const scrollToId = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    isScrollingRef.current = true;
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      setActiveId(id);
    }, SCROLL_LOCK_MS);

    if (id.startsWith('param-')) {
      const accordionTrigger = el.querySelector('button[aria-expanded="false"]');
      if (accordionTrigger) accordionTrigger.click();
    }

    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);

  return { activeId, mobileOpen, setMobileOpen, scrollToId };
}

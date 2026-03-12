'use client';

import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { ScrollShadow } from '@heroui/react';
import { cn } from '@/utils/cn';

/* ─── Root ──────────────────────────────────────────────────────────── */
const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = 'Drawer';

/* ─── Primitives ────────────────────────────────────────────────────── */
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

/* ─── Overlay ───────────────────────────────────────────────────────── */
/**
 * Blurred, semi-transparent overlay — NOT solid black.
 * vaul adds/removes a data-[state=open] attribute which drives the
 * opacity transition so it fades in/out with the drawer.
 */
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn(
      // Base
      'fixed inset-0 z-50',
      // Blurred, light overlay — tracks vaul open/close state
      'bg-black/40 backdrop-blur-sm',
      // Fade transition (shorter for snappier feel)
      'transition-opacity duration-200 ease-in-out',
      'data-[state=closed]:opacity-0 data-[state=open]:opacity-100',
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

/* ─── Content ───────────────────────────────────────────────────────── */
/**
 * direction="bottom"  <=sm : slides up, full-width, 85svh tall, rounded top corners
 * direction="right"   >sm  : slides in from right, full-height, min 480px wide
 */
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> & {
    direction?: 'bottom' | 'right';
  }
>(({ className, children, direction = 'bottom', ...props }, ref) => {
  // If the caller provided an aria-label on DrawerContent, render a hidden
  // Drawer title so screen readers (and Radix/vaul a11y checks) see a title.
  const ariaLabel = (props as any)['aria-label'] || (props as any).ariaLabel || null;

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col bg-white',
          direction === 'bottom'
            ? [
                // Bottom drawer: full-width, increased height for breathing room on mobile
                'inset-x-0 bottom-0',
                'max-h-[90svh]',
                'rounded-t-2xl',
                'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]',
                'translate-y-0',
                'data-[state=closed]:translate-y-full',
                'data-[state=open]:translate-y-0',
                'transition-transform duration-200 ease-in-out will-change-transform',
              ]
            : [
                // Right drawer: larger width on desktop for more breathing room
                'inset-y-0 right-0 h-full',
                'w-[min(640px,92vw)]',
                'rounded-l-2xl',
                'shadow-[-8px_0_32px_rgba(0,0,0,0.12)]',
                'translate-x-0',
                'data-[state=closed]:translate-x-full',
                'data-[state=open]:translate-x-0',
                'transition-transform duration-200 ease-in-out will-change-transform',
              ],
          className,
        )}
        {...props}
      >
        {/* Drag handle — bottom only */}
        {direction === 'bottom' && (
          <div className="mx-auto mt-4 mb-2 h-2 w-14 shrink-0 rounded-full bg-gray-300" />
        )}

        {/*
          Ensure an accessible title + description exist for Drawer/Dialog primitives.
          If parent passed an `aria-label`, surface a hidden Title/Description so
          vaul/Radix a11y runtime checks no longer warn.
        */}
        {ariaLabel && (
          <>
            <DrawerPrimitive.Title className="sr-only">{ariaLabel}</DrawerPrimitive.Title>
            <DrawerPrimitive.Description className="sr-only">{ariaLabel}</DrawerPrimitive.Description>
          </>
        )}

        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = 'DrawerContent';

/* ─── Layout slots ──────────────────────────────────────────────────── */

/** Sticky header — stays visible while body scrolls */
const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('shrink-0 px-5 pt-4 pb-3', 'border-b border-gray-100', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

/** Scrollable body — grows to fill available space and shows Heroui scrollshadow */
const DrawerBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <ScrollShadow
      ref={ref}
      className={cn(
        'flex-1 h-full relative overflow-y-auto',
        // More bottom padding on small screens (bottom-drawer) — increase at md+ (right-drawer)
        'px-5 pt-4 pb-12 md:pb-12',
        // Subtle scrollbar (kept for consistent appearance)
        'scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent',
        className,
      )}
      {...props}
    />
  ),
);
DrawerBody.displayName = 'DrawerBody';

/** Sticky footer */
const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('shrink-0 px-5 py-3', 'border-t border-gray-100', className)} {...props} />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn('text-base font-semibold leading-tight text-gray-900', className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500', className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

/* ─── Exports ───────────────────────────────────────────────────────── */
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};

'use client';

import * as React from 'react';
import { Drawer, Button } from '@heroui/react';
import { cn } from '@/utils/cn';

/* ─── Root ──────────────────────────────────────────────────────────── */
const HeroUIDrawer = Drawer;

/* ─── Content ───────────────────────────────────────────────────────── */
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content> & {
    direction?: 'bottom' | 'right';
  }
>(({ className, children, direction = 'bottom', ...props }, ref) => (
  <Drawer.Backdrop>
    <Drawer.Content
      ref={ref}
      placement={direction === 'right' ? 'right' : 'bottom'}
      className={cn(
        direction === 'bottom'
          ? 'max-h-[90svh] rounded-t-2xl'
          : 'w-[min(640px,92vw)] rounded-l-2xl',
        className,
      )}
      {...props}
    >
      <Drawer.Dialog>
        {direction === 'bottom' && <Drawer.Handle />}
        {children}
      </Drawer.Dialog>
    </Drawer.Content>
  </Drawer.Backdrop>
));
DrawerContent.displayName = 'DrawerContent';

/* ─── Layout slots ──────────────────────────────────────────────────── */
const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Drawer.Header
    className={cn('shrink-0 px-5 pt-4 pb-3 border-b border-gray-100', className)}
    {...props}
  />
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Drawer.Body
      ref={ref}
      className={cn(
        'flex-1 h-full relative overflow-y-auto px-5 pt-4 pb-12 md:pb-12 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent',
        className,
      )}
      {...props}
    />
  ),
);
DrawerBody.displayName = 'DrawerBody';

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Drawer.Footer
    className={cn('shrink-0 px-5 py-3 border-t border-gray-100', className)}
    {...props}
  />
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof Drawer.Heading>,
  React.ComponentPropsWithoutRef<typeof Drawer.Heading>
>(({ className, ...props }, ref) => (
  <Drawer.Heading
    ref={ref}
    className={cn('text-base font-semibold leading-tight text-gray-900', className)}
    {...props}
  />
));
DrawerTitle.displayName = 'Drawer.Heading';

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(({ className, ...props }, ref) => (
  <Drawer.Description ref={ref} className={cn('text-sm text-gray-500', className)} {...props} />
));
DrawerDescription.displayName = 'Drawer.Description';

/* ─── Close Button ──────────────────────────────────────────────────── */
const DrawerClose = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => (
  <Button ref={ref} slot="close" variant="secondary" className={cn(className)} {...props} />
));
DrawerClose.displayName = 'DrawerClose';

/* ─── Exports ───────────────────────────────────────────────────────── */
export {
  HeroUIDrawer as Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
};

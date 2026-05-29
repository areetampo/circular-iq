'use client';

import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/utils/cn';

/**
 * Wraps `react-resizable-panels` group with the app's layout classes.
 * @param {ResizablePrimitive.GroupProps & {className?: string}} props Props forwarded to the panel group.
 * @returns {import('react').ReactElement} Configured resizable panel group.
 */
function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn('flex size-full aria-[orientation=vertical]:flex-col', className)}
      {...props}
    />
  );
}

/**
 * Re-exports the primitive panel with the shared data-slot marker used by styles/tests.
 * @param {ResizablePrimitive.PanelProps} props Props forwarded to the panel primitive.
 * @returns {import('react').ReactElement} Configured resizable panel.
 */
function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

/**
 * Renders the resize separator, optionally with a visible drag handle.
 * @param {ResizablePrimitive.SeparatorProps & {withHandle?: boolean}} props Separator props; `withHandle` renders the visible drag handle.
 * @returns {import('react').ReactElement} Configured resizable separator.
 */
function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        'group/handle relative flex w-0.5 items-center justify-center bg-(--color-resizable-default) transition-colors duration-200 hover:bg-(--color-resizable-focus) focus-visible:bg-(--color-resizable-focus) focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-3 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-1.5 shrink-0 rounded-full bg-(--color-resizable-default) transition-colors duration-200 group-hover/handle:bg-(--color-resizable-focus) group-focus-visible/handle:bg-(--color-resizable-focus) hover:bg-(--color-resizable-focus)" />
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };

import { Drawer } from '@heroui/react';
import {
  Check,
  ClipboardMinus,
  Cog,
  DollarSign,
  Handshake,
  Info,
  Package,
  RefreshCw,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react';

import { BUSINESS_SOLUTION_CONTENT } from '@/constants/drawers';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks';

// Icon mapping for business solution components
const COMPONENT_ICONS = {
  'Materials and Inputs': Package,
  'Process and Technology': Cog,
  'Business Model and Logistics': Handshake,
  'Circularity Loop': RefreshCw,
  'Key Performance Metrics': TrendingUp,
  'Partnerships and Infrastructure': Users,
  'Scalability Path': Zap,
  'Economic Viability': DollarSign,
};

export default function BusinessSolutionInfoDrawer() {
  const { isDrawerOpen, onClose } = useGlobalDrawer();
  const direction = useDrawerDirection();

  return (
    <Drawer
      isOpen={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Backdrop>
        <Drawer.Content placement={direction}>
          <Drawer.Dialog>
            {direction === 'bottom' ? (
              <Drawer.Handle />
            ) : (
              <Drawer.CloseTrigger aria-label="Close" />
            )}
            <Drawer.Header>
              <div className="flex items-center gap-3 pr-8">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-drawer-icon-accent-bg)">
                  <ClipboardMinus
                    size={16}
                    className="text-(--color-drawer-icon-accent-text)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <Drawer.Heading>{BUSINESS_SOLUTION_CONTENT.title}</Drawer.Heading>
                  <p className="mt-0.5 text-sm font-normal text-(--color-text-secondary)">
                    {BUSINESS_SOLUTION_CONTENT.subtitle}
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto">
              <div className="space-y-6">
                <p className="text-sm/relaxed text-(--color-text-secondary)">
                  Describe{' '}
                  <strong className="font-medium text-(--color-text-primary)">
                    how your business solves the problem
                  </strong>{' '}
                  with technical details about materials, processes, partnerships, and outcomes.
                </p>

                <div className="my-3 rounded-xl bg-(--color-bg-card) text-sm/relaxed text-(--color-text-secondary)">
                  <h4 className="mb-3 text-base font-medium text-(--color-accent)">
                    Critical Components
                  </h4>
                  <div className="space-y-2">
                    {BUSINESS_SOLUTION_CONTENT.components.map((item, idx) => {
                      const Icon = COMPONENT_ICONS[item.title];
                      return (
                        <div
                          key={idx}
                          className="group/card relative flex cursor-default items-start gap-3.5 rounded-xl bg-(--color-accent-light) p-4 transition-colors duration-300 ease-out select-none"
                        >
                          <div className="mt-0.5 shrink-0 rounded-lg bg-(--color-accent-light) p-2 transition-[transform,box-shadow] duration-300 ease-out group-hover/card:scale-110 group-hover/card:-rotate-6 group-hover/card:shadow-md">
                            <Icon className="size-4 text-(--color-accent)" strokeWidth={2} />
                          </div>
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-sm/snug font-medium text-(--color-text-primary)">
                              {item.title}
                            </span>
                            <span className="text-xs/relaxed text-(--color-text-muted)">
                              {item.description}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="my-6 space-y-2 rounded-lg border border-(--color-warning-border) bg-warning-soft p-4 text-sm text-(--color-text-secondary)">
                  <p className="mb-3 text-xs font-bold tracking-wider text-(--color-warning) uppercase">
                    Common Pitfalls
                  </p>
                  {BUSINESS_SOLUTION_CONTENT.pitfalls.map((pitfall, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <X className="mt-0.5 size-3.5 shrink-0 text-(--color-warning)" />
                      <div>
                        <span className="text-(--color-text-primary)">
                          {typeof pitfall === 'string' ? pitfall : pitfall.title || pitfall}:{' '}
                        </span>
                        <span className="text-(--color-text-muted)">
                          {typeof pitfall === 'string' ? '' : pitfall.description || ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="my-6 space-y-2 rounded-lg border border-(--color-success-border) bg-(--color-info-soft-ui) p-4 text-sm text-(--color-text-secondary)">
                  <p className="mb-3 text-xs font-bold tracking-wider text-(--color-success) uppercase">
                    Pro Tips
                  </p>
                  {BUSINESS_SOLUTION_CONTENT.proTips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-(--color-text-secondary)"
                    >
                      <Check className="mt-0.5 size-3.5 shrink-0 text-(--color-success)" />
                      {tip}
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="mb-2 text-base font-medium text-(--color-accent)">
                    Example Statement
                  </h4>
                  <p className="rounded-lg border-l-4 border-(--color-accent) bg-(--color-accent-light) p-3 font-mono text-sm text-(--color-text-secondary)">
                    {BUSINESS_SOLUTION_CONTENT.example}
                  </p>
                </div>

                <div className="mt-6 flex items-start gap-3 rounded-lg bg-(--color-info-soft-ui) p-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-(--color-info)" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-(--color-text-primary)">
                      Minimum 200 characters required
                    </p>
                    <p className="text-xs text-black/75">
                      Longer descriptions help the AI provide more accurate analysis and better
                      scoring.
                    </p>
                  </div>
                </div>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

BusinessSolutionInfoDrawer.propTypes = {};

/**
 * @module EvaluationParametersHeadingInfoDrawer
 * @description Info drawer — Evaluation Parameters Heading Info Drawer.
 */

import { Drawer } from '@heroui/react';
import {
  BookCheck,
  Building,
  ClipboardMinus,
  Cpu,
  DollarSign,
  Package,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';

import { EVALUATION_PARAMETERS_HEADING_CONTENT } from '@/constants/drawers';
import { factorDefinitions } from '@/constants/evaluationData';
import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks';

// Icon mapping for each factor
const FACTOR_ICONS = {
  public_participation: Users,
  infrastructure: Building,
  market_price: DollarSign,
  maintenance: Wrench,
  uniqueness: Sparkles,
  size_efficiency: Package,
  chemical_safety: Shield,
  tech_readiness: Cpu,
};

/**
 * Info drawer — Evaluation Parameters Heading Info Drawer.
 * @returns {import('react').ReactElement}
 */
export default function EvaluationParametersHeadingInfoDrawer() {
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
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-drawer-icon-success-bg)">
                  <ClipboardMinus
                    size={16}
                    className="text-(--color-drawer-icon-success-text)"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <Drawer.Heading>{EVALUATION_PARAMETERS_HEADING_CONTENT.heading}</Drawer.Heading>
                  <p className="mt-0.5 text-[0.7rem] font-normal text-(--color-text-secondary)">
                    Understanding evaluation framework
                  </p>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <p className="text-sm/relaxed text-(--color-text-secondary)">
                  {EVALUATION_PARAMETERS_HEADING_CONTENT.description}
                </p>

                {Object.entries(factorDefinitions).map(([key, factor]) => {
                  const Icon = FACTOR_ICONS[key];
                  return (
                    <div
                      key={key}
                      className="group/card relative flex min-w-0 cursor-default flex-col items-start gap-0.5 rounded-xl bg-(--color-success-light) transition-colors duration-300 ease-out select-none"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          size={16}
                          className="shrink-0 text-(--color-checkbox)/75"
                          strokeWidth={2.5}
                        />
                        <span className="text-sm/snug font-medium text-(--color-text-primary)">
                          {factor.title}
                        </span>
                      </div>
                      <span className="pl-6 text-sm/relaxed text-(--color-text-muted)">
                        {factor.desc}
                      </span>
                    </div>
                  );
                })}

                <p className="rounded-xl bg-(--color-table-hover) px-3 py-2 text-[1rem] font-medium text-(--color-text-muted)">
                  {EVALUATION_PARAMETERS_HEADING_CONTENT.tip}
                  <BookCheck size={20} strokeWidth={2} className="ml-2 inline" />
                </p>
              </div>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

EvaluationParametersHeadingInfoDrawer.propTypes = {};

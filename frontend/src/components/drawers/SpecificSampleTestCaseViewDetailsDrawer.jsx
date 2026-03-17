import { Drawer } from '@heroui/react';
import { BarChart3, Lightbulb, PencilLine, Target } from 'lucide-react';
import PropTypes from 'prop-types';

import { useGlobalDrawer } from '@/contexts/DrawerContext';
import { useDrawerDirection } from '@/hooks/useDrawerDirection';
import { cn } from '@/utils/cn';

export default function SpecificSampleTestCaseViewDetailsDrawer({ testCase }) {
  if (!testCase) return null;

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
            {direction === 'bottom' && <Drawer.Handle />}
            {direction === 'right' && <Drawer.CloseTrigger />}
            <Drawer.Header>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg bg-blue-100 shrink-0',
                      'transition-[transform,box-shadow] duration-300 ease-out',
                      isDrawerOpen
                        ? 'scale-[1.12] -rotate-6 drop-shadow-md'
                        : 'hover:scale-110 hover:-rotate-6 hover:shadow-md',
                    )}
                  >
                    <PencilLine className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <Drawer.Heading className="text-lg font-semibold">
                      {testCase.title}
                    </Drawer.Heading>
                  </div>
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="gap-6 mt-4">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-5 text-emerald-600" strokeWidth={2} />
                    <h3 className="text-base font-bold text-gray-900">Business Problem</h3>
                  </div>
                  <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl">
                    <p className="text-sm leading-relaxed text-gray-600">{testCase.problem}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="size-5 text-teal-600" strokeWidth={2} />
                    <h3 className="text-base font-bold text-gray-900">Business Solution</h3>
                  </div>
                  <div className="p-4 border border-teal-200 bg-teal-50 rounded-xl">
                    <p className="text-sm leading-relaxed text-gray-600">{testCase.solution}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="size-5 text-blue-600" strokeWidth={2} />
                    <h3 className="text-base font-bold text-gray-900">Parameter Scores</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {Object.entries(testCase.parameters).map(([key, value]) => {
                      const isGood = value >= 75;
                      const isMedium = value >= 50;
                      return (
                        <div
                          key={key}
                          className={`p-4 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-2 ${
                            isGood
                              ? 'bg-emerald-100 border-emerald-300'
                              : isMedium
                                ? 'bg-yellow-100 border-yellow-300'
                                : 'bg-red-100 border-red-300'
                          }`}
                        >
                          <div
                            className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                              isGood
                                ? 'text-emerald-700'
                                : isMedium
                                  ? 'text-yellow-700'
                                  : 'text-red-700'
                            }`}
                          >
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              isGood
                                ? 'text-emerald-600'
                                : isMedium
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {value}
                          </div>
                        </div>
                      );
                    })}
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

SpecificSampleTestCaseViewDetailsDrawer.propTypes = {
  testCase: PropTypes.shape({
    title: PropTypes.string.isRequired,
    problem: PropTypes.string.isRequired,
    solution: PropTypes.string.isRequired,
    parameters: PropTypes.object.isRequired,
  }).isRequired,
};

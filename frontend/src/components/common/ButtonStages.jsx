/** Multi-stage action button for submit flows that report loading progress. */

import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import Button from './Button';
import LoaderIcon from './LoaderIcon';

/**
 * Renders a submit-style button that crossfades between idle text and animated loading stages.
 * Stage text animates out/in when `currentStage` changes during an active load.
 */
export default function ButtonStages({
  isLoading,
  isValid,
  onPress,
  currentStage = 'Processing...',
  variant = 'teal',
  fullWidth = false,
  buttonText = 'Press Button',
  className,
  buttonTextCn,
  ...props
}) {
  // Separate flags let idle and loading text crossfade without changing button layout.
  const [showNonLoading, setShowNonLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(false);
  const [displayedStage, setDisplayedStage] = useState('');
  const [stageAnimation, setStageAnimation] = useState(''); // 'out' or 'in'
  const timeoutRef = useRef(null);
  const prevStageRef = useRef('');

  // Loading starts after the idle label exits, keeping the two text layers from overlapping.
  useEffect(() => {
    if (isLoading) {
      setShowNonLoading(false);
      const timer = setTimeout(() => {
        setShowLoading(true);
        setDisplayedStage(currentStage || 'Processing...');
        prevStageRef.current = currentStage || 'Processing...';
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
      const timer = setTimeout(() => {
        setShowNonLoading(true);
        setDisplayedStage('');
        prevStageRef.current = '';
        setStageAnimation('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentStage]);

  // Stage changes animate only after loading content is visible and no text transition is active.
  useEffect(() => {
    if (!showLoading) return;
    if (!currentStage) return;
    if (currentStage === prevStageRef.current) return;
    if (stageAnimation !== '') return;

    setStageAnimation('out');

    // Swap text between exit and enter phases so the replacement does not pop in.
    const timer = setTimeout(() => {
      setDisplayedStage(currentStage);
      prevStageRef.current = currentStage;
      setStageAnimation('in');

      const timer2 = setTimeout(() => setStageAnimation(''), 300);
      timeoutRef.current = timer2;
    }, 300);
    timeoutRef.current = timer;
  }, [currentStage, showLoading, displayedStage, stageAnimation]);

  // Prevent late stage timers from updating unmounted buttons.
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isDisabled = isLoading || !isValid;

  return (
    <Button
      {...props}
      size="lg"
      onPress={onPress}
      isDisabled={isDisabled}
      variant={variant}
      fullWidth={fullWidth}
      className={cn('h-12 rounded-4xl', className)}
    >
      <div className="relative flex w-full items-center justify-center">
        {/* Non-loading text */}
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center whitespace-nowrap transition-all duration-300 ease-in-out',
            showNonLoading ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0',
            buttonTextCn,
          )}
        >
          {buttonText}
        </span>

        {/* Loading content (spinner + stage text) */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center gap-3 transition-all duration-300 ease-in-out',
            showLoading ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
          )}
        >
          <LoaderIcon
            color="#ffffff"
            isButton
            className="mt-px"
            allowedLoaderNames={['Pinwheel']}
          />
          <span
            className={cn(
              'text-[0.85rem] tracking-[0.01em] whitespace-nowrap',
              stageAnimation === 'out' && 'animate-fade-out-up',
              stageAnimation === 'in' && 'animate-fade-in-up',
              buttonTextCn,
            )}
          >
            {displayedStage || 'Processing...'}
          </span>
        </div>
      </div>
    </Button>
  );
}

ButtonStages.propTypes = {
  /** Whether button is in a loading state */
  isLoading: PropTypes.bool.isRequired,
  /** Whether button action is currently valid/enabled */
  isValid: PropTypes.bool.isRequired,
  /** Callback function when the button is pressed */
  onPress: Button.propTypes.onPress,
  /** Current stage text to display during loading */
  currentStage: PropTypes.string,
  /** Button variant/color scheme */
  variant: Button.propTypes.variant,
  /** Whether button should take full width */
  fullWidth: Button.propTypes.fullWidth,
  /* text in the button */
  buttonText: PropTypes.string,
  /** Additional CSS classes to apply */
  className: PropTypes.string,
  /** Additional CSS classes for button text */
  buttonTextCn: PropTypes.string,
};

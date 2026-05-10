// src/components/common/ButtonStages.jsx
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

import Button from './Button';
import LoaderIcon from './LoaderIcon';

/**
 * ButtonStages - A button component that handles different states with loading animations
 *
 * This component displays a button that can show different stages of a process
 * with smooth crossfade animations during loading states. It shows a loader
 * icon and animates between different stage text when the stage changes.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether the button is in a loading state
 * @param {boolean} props.isValid - Whether the button action is currently valid/enabled
 * @param {Function} props.onPress - Callback function when the button is pressed
 * @param {string} props.currentStage - Current stage text to display during loading
 * @param {string} [props.variant='teal'] - Button variant/color scheme
 * @param {boolean} [props.fullWidth=false] - Whether to button should take full width
 * @param {string} [props.buttonText='Press Button'] - Text to display on button when not loading
 * @param {string} [props.className] - Additional CSS classes to apply
 * @param {string} [props.buttonTextCn] - Additional CSS classes for button text
 *
 * @returns {JSX.Element} A button component with stage animations
 *
 * @example
 * <ButtonStages
 *   loading={isLoading}
 *   isValid={isFormValid}
 *   onPress={handleSubmit}
 *   currentStage="Validating input..."
 *   variant="blue"
 *   fullWidth={true}
 *   buttonText="Submit"
 *   className="rounded-full"
 * />
 */
export default function ButtonStages({
  loading,
  isValid,
  onPress,
  currentStage = 'Processing...',
  variant = 'teal',
  fullWidth = false,
  buttonText = 'Press Button',
  className,
  buttonTextCn,
}) {
  // Content for non-loading state
  const [showNonLoading, setShowNonLoading] = useState(true);
  // Content for loading state
  const [showLoading, setShowLoading] = useState(false);
  // Stage animation state for loading text changes
  const [displayedStage, setDisplayedStage] = useState('');
  const [stageAnimation, setStageAnimation] = useState(''); // 'out' or 'in'
  const timeoutRef = useRef(null);
  const prevStageRef = useRef('');

  // Handle transition between button text and loading content
  useEffect(() => {
    if (loading) {
      // Start exit of button text
      setShowNonLoading(false);
      // After exit animation, show loading content
      const timer = setTimeout(() => {
        setShowLoading(true);
        // Set first stage immediately with no stage animation (will be handled below)
        setDisplayedStage(currentStage || 'Processing...');
        prevStageRef.current = currentStage || 'Processing...';
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Exit loading content
      setShowLoading(false);
      const timer = setTimeout(() => {
        setShowNonLoading(true);
        setDisplayedStage('');
        prevStageRef.current = '';
        setStageAnimation('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, currentStage]);

  // Handle stage changes while loading is active AND content is visible
  useEffect(() => {
    if (!showLoading) return;
    if (!currentStage) return;
    if (currentStage === prevStageRef.current) return;
    if (stageAnimation !== '') return;

    // Start exit animation on current displayed stage
    setStageAnimation('out');

    // After exit, swap text and start enter animation
    const timer = setTimeout(() => {
      setDisplayedStage(currentStage);
      prevStageRef.current = currentStage;
      setStageAnimation('in');

      // After enter finishes, clear animation state
      const timer2 = setTimeout(() => setStageAnimation(''), 300);
      timeoutRef.current = timer2;
    }, 300);
    timeoutRef.current = timer;
  }, [currentStage, showLoading, displayedStage, stageAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const isDisabled = loading || !isValid;

  return (
    <Button
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
  loading: PropTypes.bool.isRequired,
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

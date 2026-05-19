/**
 * @module ExpandableText
 * @description Long text with show more/less toggle for assessment and case summaries.
 */

import PropTypes from 'prop-types';
import { useState } from 'react';

import { cn } from '@/utils/cn';

/**
 * ExpandableText component that truncates text and provides expand/collapse functionality
 * Used by ProblemText and SolutionText components
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Text content to display and potentially truncate
 * @param {number} [props.limit=280] - Character limit before truncation
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.showMoreText='Show more'] - Text for expand button
 * @param {string} [props.showLessText='Show less'] - Text for collapse button
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered ExpandableText component
 *
 * @example
 * Basic usage
 * <ExpandableText>This is a long text that will be truncated...</ExpandableText>
 *
 * @example
 * Custom limit and button text
 * <ExpandableText limit={100} showMoreText="Read more" showLessText="Read less">
 *   Very long text content here...
 * </ExpandableText>
 */
export default function ExpandableText({
  children,
  limit = 280,
  className = '',
  showMoreText = 'Show more',
  showLessText = 'Show less',
  ...props
}) {
  const [expanded, setExpanded] = useState(false);

  // Extract text content from children
  let textContent = null;
  if (typeof children === 'string') {
    textContent = children;
  } else if (Array.isArray(children)) {
    const textChild = children.find((child) => typeof child === 'string');
    if (textChild) textContent = textChild;
  } else if (children && typeof children.toString === 'function') {
    const stringContent = children.toString();
    if (stringContent !== '[object Object]') {
      textContent = stringContent;
    }
  }

  // If no text content found, render children as-is
  if (!textContent) {
    return <div className={className}>{children}</div>;
  }

  const isLong = textContent.length > limit;
  const displayContent = expanded || !isLong ? textContent : textContent.slice(0, limit) + '…';

  return (
    <div {...props}>
      <p
        className={cn(
          'text-[0.8125rem]/relaxed wrap-break-word text-(--color-text-secondary)',
          className,
        )}
      >
        {displayContent}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-(--color-accent) transition-colors hover:text-(--color-accent-hover)"
        >
          {expanded ? showLessText : showMoreText}
        </button>
      )}
    </div>
  );
}

ExpandableText.propTypes = {
  /** Content to display and potentially truncate */
  children: PropTypes.node.isRequired,
  /** Maximum number of characters before truncation */
  limit: PropTypes.number,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Text for show more button */
  showMoreText: PropTypes.string,
  /** Text for show less button */
  showLessText: PropTypes.string,
};

ExpandableText.displayName = 'ExpandableText';

import PropTypes from 'prop-types';
import { useState } from 'react';

import { cn } from '@/utils/cn';

/**
 * ExpandableText component that truncates text and provides expand/collapse functionality
 * Used by ProblemText and SolutionText components
 */
export default function ExpandableText({
  children,
  limit = 280,
  className = '',
  showMoreText = 'Show more',
  showLessText = 'Show less',
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
    <div>
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

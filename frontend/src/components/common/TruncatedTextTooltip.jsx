/**
 * @module TruncatedTextTooltip
 * @description Ellipsis truncation with full-text tooltip on hover/focus.
 */

import { Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';

/**
 * TruncatedTextTooltip component that truncates text and shows full text in a tooltip
 * Follows the same truncation logic as the Chip component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Text content to display and potentially truncate
 * @param {number} [props.limit=30] - Character limit before truncation
 * @param {number} [props.tooltipDelay=100] - Delay in milliseconds before showing tooltip
 * @param {Object.<string, any>} props - Additional attributes to spread to the element
 * @returns {JSX.Element} Rendered TruncatedTextTooltip component
 *
 * @example
 * Basic usage
 * <TruncatedTextTooltip>This is a long text that will be truncated...</TruncatedTextTooltip>
 *
 * @example
 * Custom limit and delay
 * <TruncatedTextTooltip limit={50} tooltipDelay={200}>
 *   Very long text content here...
 * </TruncatedTextTooltip>
 */
export default function TruncatedTextTooltip({
  children,
  limit = 30,
  tooltipDelay = 100,
  ...props
}) {
  // Extract text content from children
  let textContent = null;

  if (typeof children === 'string') {
    textContent = children;
  } else if (Array.isArray(children)) {
    // Handle array of children - extract string content
    const textChild = children.find((child) => typeof child === 'string');
    if (textChild) textContent = textChild;
  } else if (children && typeof children.toString === 'function') {
    // Handle other types that can be converted to string
    const stringContent = children.toString();
    if (stringContent !== '[object Object]') {
      textContent = stringContent;
    }
  }

  // If no text content found, render children as-is
  if (!textContent) {
    return <span {...props}>{children}</span>;
  }

  // Check if truncation is needed
  const isTruncated = textContent.length > limit;
  const displayContent = isTruncated ? textContent.slice(0, limit) + '...' : textContent;

  // Create the text element
  const textElement = <span>{displayContent}</span>;

  // Wrap with Tooltip only when truncated
  if (isTruncated) {
    return (
      <Tooltip delay={tooltipDelay}>
        <Tooltip.Trigger tabIndex={0}>{textElement}</Tooltip.Trigger>
        <Tooltip.Content className="max-h-48 max-w-xs overflow-y-auto">
          <p className="max-w-xs">{textContent}</p>
        </Tooltip.Content>
      </Tooltip>
    );
  }

  return <span {...props}>{textElement}</span>;
}

TruncatedTextTooltip.propTypes = {
  /** Content to truncate and display */
  children: PropTypes.node.isRequired,
  /** Maximum number of characters before truncation */
  limit: PropTypes.number,
  /** Tooltip delay in milliseconds */
  tooltipDelay: PropTypes.number,
};

TruncatedTextTooltip.displayName = 'TruncatedTextTooltip';

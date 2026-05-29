/** Ellipsis truncation with full-text HeroUI tooltip when over the character limit. */

import { Tooltip } from '@heroui/react';
import PropTypes from 'prop-types';

/**
 * Renders string-like children with ellipsis truncation and a tooltip for the full text.
 */
export default function TruncatedTextTooltip({
  children,
  limit = 30,
  tooltipDelay = 100,
  ...props
}) {
  // Accept primitive and string-like children while leaving opaque React nodes untouched.
  let textContent = null;

  if (typeof children === 'string') {
    textContent = children;
  } else if (Array.isArray(children)) {
    // Arrays often contain icon/text pairs, so use the first string child as the label.
    const textChild = children.find((child) => typeof child === 'string');
    if (textChild) textContent = textChild;
  } else if (children && typeof children.toString === 'function') {
    // Primitive wrapper values can be displayed, but plain React objects should pass through.
    const stringContent = children.toString();
    if (stringContent !== '[object Object]') {
      textContent = stringContent;
    }
  }

  // Opaque React nodes cannot be safely truncated without changing their structure.
  if (!textContent) {
    return <span {...props}>{children}</span>;
  }

  const isTruncated = textContent.length > limit;
  const displayContent = isTruncated ? textContent.slice(0, limit) + '...' : textContent;

  const textElement = <span>{displayContent}</span>;

  // Only truncated labels need a focusable tooltip trigger.
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

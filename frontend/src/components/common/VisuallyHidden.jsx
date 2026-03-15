import PropTypes from 'prop-types';

/**
 * VisuallyHidden Component
 * Hides content visually but keeps it accessible for screen readers
 * Replacement for @radix-ui/react-visually-hidden
 */
export function VisuallyHidden({ children, as: Component = 'span', ...props }) {
  return (
    <Component
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

VisuallyHidden.propTypes = {
  children: PropTypes.node.isRequired,
  as: PropTypes.elementType,
};

export default VisuallyHidden;

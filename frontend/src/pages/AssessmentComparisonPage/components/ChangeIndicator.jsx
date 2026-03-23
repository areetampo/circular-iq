import { Chip } from '@heroui/react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

function ChangeIndicator({ diff }) {
  if (diff > 0) {
    return (
      <Chip color="success" variant="soft" size="sm" className="transition-all duration-200">
        <TrendingUp size={14} />
        <Chip.Label>+{diff}</Chip.Label>
      </Chip>
    );
  } else if (diff < 0) {
    return (
      <Chip color="danger" variant="soft" size="sm" className="transition-all duration-200">
        <TrendingDown size={14} />
        <Chip.Label>{diff}</Chip.Label>
      </Chip>
    );
  }
  return (
    <Chip color="default" variant="soft" size="sm" className="transition-all duration-200">
      <Minus size={14} />
      <Chip.Label>0</Chip.Label>
    </Chip>
  );
}

ChangeIndicator.propTypes = {
  /** Numeric difference value (can be positive, negative, or zero) */
  diff: PropTypes.number.isRequired,
};

export { ChangeIndicator };
export default ChangeIndicator;

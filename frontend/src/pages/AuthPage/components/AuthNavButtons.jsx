/**
 * Shared auth-page navigation actions for assessment start, guide, and solutions routes.
 */

import { MoveRight, Telescope, TextSearch } from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';

import { Button } from '@/components/common';
import { cn } from '@/utils/cn';

/**
 * Renders the secondary navigation actions shown beside the auth forms.
 */
export default function AuthNavButtons({ className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Button variant="bordered" as={HashLink} to="/#ce-assessment-form" smooth icon={MoveRight}>
        Start an Assessment
      </Button>
      <div className="flex items-center justify-center gap-3">
        <Button variant="success-soft" as={Link} to="/guide" icon={TextSearch}>
          User Guide
        </Button>
        <Button variant="success-soft" as={Link} to="/solutions" icon={Telescope}>
          Explore Solutions
        </Button>
      </div>
    </div>
  );
}

AuthNavButtons.propTypes = {
  className: PropTypes.string,
};

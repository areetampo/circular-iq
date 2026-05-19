/**
 * @module AuthRightPanel
 * @description Right panel hosting login/signup tabs and forms.
 */

import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

import { cn } from '@/utils/cn';

import AuthBrandHeader from './AuthBrandHeader';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

/**
 * Right panel hosting login/signup tabs and forms.
 *
 * @param {Object} props
 * @param {string} props.view
 * @param {Function} props.setView
 * @returns {import('react').ReactElement}
 */
export default function AuthRightPanel({ view, setView }) {
  const formRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;

      const active = document.activeElement;
      const tag = active?.tagName;

      // Let anchors navigate normally.
      if (tag === 'A') return;

      // If focus is on any button, prevent its default Enter behaviour
      // (re-click / form submit via that button) and manually trigger our
      // controlled submit instead — this covers CopyButton (which renders as
      // type="submit" inside HeroUI <Form>) and FILL (type="button").
      if (tag === 'BUTTON') {
        e.preventDefault();
        e.stopPropagation();
        formRef.current?.submit();
        return;
      }

      formRef.current?.submit();
    };

    // Use capture:true so this fires before the HeroUI <Form> can swallow
    // the Enter event (which was preventing the FILL button case from logging).
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 md:px-12 lg:px-16">
      <AuthBrandHeader className={cn('md_lg:hidden', view === 'login' && '-mt-36')} layout="row" />
      <div
        className={cn(
          'w-full max-w-105 md:max-w-md lg:max-w-105',
          view === 'signup' && 'md_lg:mt-8',
        )}
      >
        {view === 'login' ? (
          <LoginForm ref={formRef} onSwitchToSignup={() => setView('signup')} />
        ) : (
          <SignupForm ref={formRef} onSwitchToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}

AuthRightPanel.propTypes = {
  view: PropTypes.oneOf(['login', 'signup']).isRequired,
  setView: PropTypes.func.isRequired,
  className: PropTypes.string,
};

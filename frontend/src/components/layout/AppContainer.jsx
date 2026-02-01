import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import Header from './Header';
import Footer from './Footer';

export default function AppContainer({ children, className = '', headerProps = null }) {
  return (
    <div className={cn('min-h-screen flex flex-col bg-slate-50/50', className)}>
      {/* Sticky Header */}
      {headerProps && <Header {...headerProps} />}

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

AppContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  headerProps: PropTypes.object,
};

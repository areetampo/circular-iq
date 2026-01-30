import React from 'react';
import PropTypes from 'prop-types';
import Header from './Header';
import Footer from './Footer';

export default function AppContainer({ children, className = '', headerProps = null }) {
  return (
    <div className={`app-container ${className}`}>
      {headerProps && <Header {...headerProps} />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

AppContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  headerProps: PropTypes.object,
};

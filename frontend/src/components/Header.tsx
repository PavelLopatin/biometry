import React from 'react';
import '../styles/Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="logo">Smart Wallet</h1>
        </div>
      </div>
    </header>
  );
};

export default Header; 
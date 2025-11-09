import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, language, onLanguageChange }) => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-content">
        <Header 
          language={language} 
          onLanguageChange={onLanguageChange} 
        />
        <main className="content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
import React from 'react';
import NotificationBell from '../common/NotificationBell';

const Header = ({ language, onLanguageChange }) => {
  return (
    <header className="header">
      <div className="logo">
        <h1 style={{ 
          color: 'var(--primary-color)', 
          fontSize: '1.5rem', 
          fontWeight: '700' 
        }}>
          ViaFix
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <select 
          value={language} 
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            padding: '0.5rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--surface)'
          }}
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
          <option value="kz">Қазақша</option>
        </select>
        
        <NotificationBell />
      </div>
    </header>
  );
};

export default Header;
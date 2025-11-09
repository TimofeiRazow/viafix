import React from 'react';

const LanguageSelect = ({ onLanguageSelect }) => {
  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'kz', name: 'Қазақша', flag: '🇰🇿' }
  ];

  return (
    <div className="auth-container">
      <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700', 
            color: 'var(--primary-color)',
            marginBottom: '0.5rem'
          }}>
            ViaFix
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Выберите язык / Select language / Тілді таңдаңыз</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {languages.map(language => (
            <button
              key={language.code}
              onClick={() => onLanguageSelect(language.code)}
              className="btn"
              style={{
                justifyContent: 'flex-start',
                padding: '1rem 1.5rem',
                background: 'var(--background)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)'
              }}
            >
              <span style={{ fontSize: '1.25rem', marginRight: '1rem' }}>{language.flag}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSelect;
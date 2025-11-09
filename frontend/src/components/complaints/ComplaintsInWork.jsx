import React from 'react';
import ComplaintList from './ComplaintList';

const ComplaintsInWork = () => {
  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '4px',
            height: '24px',
            background: 'var(--primary-color)',
            borderRadius: '2px'
          }}></div>
          <h2 style={{ margin: 0 }}>Жалобы в работе</h2>
        </div>
        <p style={{ 
          margin: 0, 
          color: 'var(--text-secondary)',
          lineHeight: '1.5'
        }}>
          На этой странице отображаются жалобы, которые находятся в процессе обработки и выполнения. 
          Вы можете отслеживать прогресс и управлять статусами работ.
        </p>
      </div>

      <ComplaintList />
    </div>
  );
};

export default ComplaintsInWork;
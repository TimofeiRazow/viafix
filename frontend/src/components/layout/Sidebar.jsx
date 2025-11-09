import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/complaints', icon: '📋', label: 'Список жалоб' },
    { path: '/map', icon: '🗺️', label: 'Карта города' },
    { path: '/analytics', icon: '📊', label: 'Аналитика и отчет' },
  ];

  return (
    <aside className="sidebar">
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid var(--border)',
        fontSize: '0.875rem',
        color: 'var(--text-secondary)'
      }}>
        ViaFix Admin Panel v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
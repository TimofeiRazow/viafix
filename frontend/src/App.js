import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/auth';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ComplaintList from './components/complaints/ComplaintList';
import ComplaintsInWork from './components/complaints/ComplaintsInWork';
import CityMap from './components/map/CityMap';
import Analytics from './components/analytics/Analytics';
import LanguageSelect from './components/common/LanguageSelect';
import './styles/globals.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [language, setLanguage] = useState('ru');

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <Routes>
          <Route path="/register" element={<Register onLanguageSelect={setLanguage} />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  if (!language) {
    return <LanguageSelect onLanguageSelect={setLanguage} />;
  }

  return (
    <Layout language={language} onLanguageChange={setLanguage}>
      <Routes>
        <Route path="/complaints" element={<ComplaintList />} />
        <Route path="/in-progress" element={<ComplaintsInWork />} />
        <Route path="/map" element={<CityMap />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/complaints" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
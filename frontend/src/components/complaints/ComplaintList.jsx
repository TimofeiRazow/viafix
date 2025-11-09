import React, { useState, useEffect } from 'react';
import ComplaintCard from './ComplaintCard';
import { complaintsAPI } from '../../services/api';

const ComplaintList = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadComplaints();
  }, [filter]);

  const loadComplaints = async () => {
    try {
      const status = filter === 'all' ? null : filter;
      const response = await complaintsAPI.getComplaints(status);
      setComplaints(response.data.complaints);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await complaintsAPI.updateComplaint(complaintId, { status: newStatus });
      loadComplaints(); // Reload the list
    } catch (error) {
      console.error('Error updating complaint:', error);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>Список жалоб</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontWeight: '500' }}>Фильтр:</span>
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--surface)'
              }}
            >
              <option value="all">Все жалобы</option>
              <option value="pending">Ожидают</option>
              <option value="processing">В обработке</option>
              <option value="in_progress">В работе</option>
              <option value="resolved">Решены</option>
              <option value="rejected">Отклонены</option>
            </select>
            
            <button 
              className="btn btn-secondary"
              onClick={loadComplaints}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>🔄</span>
              Обновить
            </button>
          </div>
        </div>
      </div>

      {complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ marginBottom: '0.5rem' }}>Жалоб не найдено</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {filter === 'all' 
              ? 'На данный момент нет зарегистрированных жалоб' 
              : `Нет жалоб со статусом "${getStatusLabel(filter)}"`}
          </p>
        </div>
      ) : (
        <div className="complaint-grid">
          {complaints.map(complaint => (
            <ComplaintCard 
              key={complaint.id}
              complaint={complaint}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const getStatusLabel = (status) => {
  const statusLabels = {
    pending: 'Ожидают',
    processing: 'В обработке',
    in_progress: 'В работе',
    resolved: 'Решены',
    rejected: 'Отклонены'
  };
  return statusLabels[status] || status;
};

export default ComplaintList;
import React, { useState } from 'react';

const ComplaintCard = ({ complaint, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleStatusChange = async (newStatus) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate(complaint.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      processing: 'status-processing',
      in_progress: 'status-processing',
      resolved: 'status-resolved',
      rejected: 'error-color'
    };
    return colors[status] || 'status-pending';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидает',
      processing: 'В обработке',
      in_progress: 'В работе',
      resolved: 'Решена',
      rejected: 'Отклонена'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card complaint-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Жалоба #{complaint.id}</h3>
          <div className={`status-badge ${getStatusColor(complaint.status)}`}>
            {getStatusLabel(complaint.status)}
          </div>
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {formatDate(complaint.created_at)}
        </span>
      </div>

      {complaint.image_path && (
        <div style={{ marginBottom: '1rem', borderRadius: '8px', overflow: 'hidden' }}>
          <img 
            src={`http://localhost:8000/${complaint.image_path}`}
            alt="Фото проблемы"
            style={{ 
              width: '100%', 
              height: '200px', 
              objectFit: 'cover',
              cursor: 'pointer'
            }}
            onClick={() => window.open(`http://localhost:8000/${complaint.image_path}`, '_blank')}
          />
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: '500' }}>Категория:</span>
          <span style={{ 
            background: 'var(--background)', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            {complaint.category || 'Не определена'}
          </span>
        </div>
        
        {complaint.ai_confidence && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '500' }}>Уверенность AI:</span>
            <span style={{ 
              color: complaint.ai_confidence > 0.7 ? 'var(--success-color)' : 
                     complaint.ai_confidence > 0.4 ? 'var(--warning-color)' : 'var(--error-color)',
              fontSize: '0.875rem',
              fontWeight: '600'
            }}>
              {(complaint.ai_confidence * 100).toFixed(1)}%
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '500' }}>Координаты:</span>
          <span style={{ fontSize: '0.875rem' }}>
            {complaint.lat.toFixed(4)}, {complaint.lon.toFixed(4)}
          </span>
        </div>
      </div>

      {complaint.description && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            {showDetails ? complaint.description : `${complaint.description.slice(0, 100)}...`}
            {complaint.description.length > 100 && (
              <button 
                onClick={() => setShowDetails(!showDetails)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                {showDetails ? 'Скрыть' : 'Показать всё'}
              </button>
            )}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {complaint.status === 'pending' && (
          <>
            <button 
              className="btn btn-primary"
              onClick={() => handleStatusChange('processing')}
              disabled={isUpdating}
              style={{ flex: 1, fontSize: '0.875rem' }}
            >
              {isUpdating ? '...' : 'Взять в работу'}
            </button>
            <button 
              className="btn"
              onClick={() => handleStatusChange('rejected')}
              disabled={isUpdating}
              style={{ 
                flex: 1, 
                fontSize: '0.875rem',
                background: 'var(--error-color)',
                color: 'white'
              }}
            >
              {isUpdating ? '...' : 'Отклонить'}
            </button>
          </>
        )}
        
        {complaint.status === 'processing' && (
          <>
            <button 
              className="btn btn-success"
              onClick={() => handleStatusChange('in_progress')}
              disabled={isUpdating}
              style={{ flex: 1, fontSize: '0.875rem' }}
            >
              {isUpdating ? '...' : 'Начать работу'}
            </button>
            <button 
              className="btn"
              onClick={() => handleStatusChange('pending')}
              disabled={isUpdating}
              style={{ 
                flex: 1, 
                fontSize: '0.875rem',
                background: 'var(--warning-color)',
                color: 'white'
              }}
            >
              {isUpdating ? '...' : 'Вернуть'}
            </button>
          </>
        )}
        
        {complaint.status === 'in_progress' && (
          <>
            <button 
              className="btn btn-success"
              onClick={() => handleStatusChange('resolved')}
              disabled={isUpdating}
              style={{ flex: 1, fontSize: '0.875rem' }}
            >
              {isUpdating ? '...' : 'Завершить'}
            </button>
            <button 
              className="btn"
              onClick={() => handleStatusChange('processing')}
              disabled={isUpdating}
              style={{ 
                flex: 1, 
                fontSize: '0.875rem',
                background: 'var(--secondary-color)',
                color: 'white'
              }}
            >
              {isUpdating ? '...' : 'На паузу'}
            </button>
          </>
        )}

        {(complaint.status === 'resolved' || complaint.status === 'rejected') && (
          <button 
            className="btn btn-secondary"
            onClick={() => handleStatusChange('pending')}
            disabled={isUpdating}
            style={{ flex: 1, fontSize: '0.875rem' }}
          >
            {isUpdating ? '...' : 'Вернуть в ожидание'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ComplaintCard;
import React, { useState, useEffect } from 'react';
import { analyticsAPI, complaintsAPI } from '../../services/api';
import { generateExcelReport } from '../../utils/exportUtils';

const Analytics = () => {
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {},
    byCategory: {},
    dailyCount: []
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, [dateRange]);

  const loadStatistics = async () => {
    try {
      // Загружаем все жалобы для анализа
      const response = await complaintsAPI.getComplaints();
      const complaints = response.data.complaints;
      
      // Фильтруем по дате
      const filteredComplaints = complaints.filter(complaint => {
        const complaintDate = new Date(complaint.created_at).toISOString().split('T')[0];
        return complaintDate >= dateRange.start && complaintDate <= dateRange.end;
      });

      calculateStatistics(filteredComplaints);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (complaints) => {
    const byStatus = {};
    const byCategory = {};
    const dailyCount = {};

    complaints.forEach(complaint => {
      // Статистика по статусам
      byStatus[complaint.status] = (byStatus[complaint.status] || 0) + 1;
      
      // Статистика по категориям
      const category = complaint.category || 'unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;
      
      // Статистика по дням
      const date = new Date(complaint.created_at).toISOString().split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });

    setStats({
      total: complaints.length,
      byStatus,
      byCategory,
      dailyCount: Object.entries(dailyCount)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await generateExcelReport(stats, dateRange);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Ошибка при экспорте отчета');
    } finally {
      setExporting(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Ожидают',
      processing: 'В обработке',
      in_progress: 'В работе',
      resolved: 'Решены',
      rejected: 'Отклонены'
    };
    return labels[status] || status;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      pothole: 'Ямы',
      multiple_potholes: 'Множественные ямы',
      possible_pothole: 'Возможные ямы',
      manhole: 'Люки',
      sidewalk_damage: 'Повреждения тротуара',
      unknown: 'Неизвестно',
      error: 'Ошибка'
    };
    return labels[category] || category;
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
          <h2 style={{ margin: 0 }}>Аналитика и отчеты</h2>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>С:</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', fontSize: '0.875rem' }}>По:</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                style={{
                  padding: '0.5rem',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <button 
              className="btn btn-success"
              onClick={handleExport}
              disabled={exporting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {exporting ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                  Экспорт...
                </>
              ) : (
                <>
                  <span>📊</span>
                  Экспорт в Excel
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Общая статистика */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Общая статистика</h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Всего жалоб</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {stats.byStatus.resolved || 0}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Решено жалоб</div>
          </div>
          
          <div style={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {Math.round(((stats.byStatus.resolved || 0) / stats.total) * 100) || 0}%
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Эффективность</div>
          </div>
        </div>

        {/* Статистика по статусам */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Распределение по статусам</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{getStatusLabel(status)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '600' }}>{count}</span>
                    <div style={{ 
                      width: '100px', 
                      height: '8px', 
                      background: 'var(--border)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(count / stats.total) * 100}%`,
                        height: '100%',
                        background: status === 'resolved' ? 'var(--success-color)' : 
                                   status === 'in_progress' ? 'var(--primary-color)' :
                                   status === 'processing' ? 'var(--warning-color)' : 'var(--secondary-color)',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Статистика по категориям */}
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Распределение по категориям</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{getCategoryLabel(category)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontWeight: '600' }}>{count}</span>
                    <div style={{ 
                      width: '100px', 
                      height: '8px', 
                      background: 'var(--border)',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(count / stats.total) * 100}%`,
                        height: '100%',
                        background: '#2563eb',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* График по дням */}
      {stats.dailyCount.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Активность по дням</h3>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: '4px', 
            height: '200px',
            padding: '1rem 0'
          }}>
            {stats.dailyCount.map((day, index) => {
              const maxCount = Math.max(...stats.dailyCount.map(d => d.count));
              const height = (day.count / maxCount) * 150;
              
              return (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${height}px`,
                      background: 'linear-gradient(to top, #2563eb, #3b82f6)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: '4px'
                    }}
                  ></div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    marginTop: '0.5rem',
                    writingMode: 'vertical-rl',
                    transform: 'rotate(180deg)'
                  }}>
                    {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
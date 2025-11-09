import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getComplaintsForMap } from '../../services/api';
import { createSmoothPolygon } from '../../utils/polygonUtils';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CityMap = () => {
  const [complaints, setComplaints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef();

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const data = await getComplaintsForMap();
      setComplaints(data);
      
      // Создаем кластеры и полигоны
      const newClusters = createClusters(data);
      setClusters(newClusters);
    } catch (error) {
      console.error('Error loading complaints for map:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClusters = (points) => {
    if (!points.length) return [];
    
    // Простой алгоритм кластеризации по расстоянию
    const clusters = [];
    const visited = new Set();
    
    points.forEach((point, index) => {
      if (visited.has(index)) return;
      
      const cluster = [point];
      visited.add(index);
      
      // Находим ближайшие точки
      points.forEach((otherPoint, otherIndex) => {
        if (!visited.has(otherIndex) && getDistance(point, otherPoint) < 0.02) { // ~2km
          cluster.push(otherPoint);
          visited.add(otherIndex);
        }
      });
      
      if (cluster.length > 3) { // Минимум 4 точки для полигона
        clusters.push(cluster);
      }
    });
    
    return clusters.map(cluster => createSmoothPolygon(cluster));
  };

  const getDistance = (point1, point2) => {
    const R = 6371; // Earth radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lon - point1.lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading-spinner" style={{ margin: '2rem auto' }}></div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Карта города</h2>
      
      <div className="map-container">
        <MapContainer
          center={[51.1694, 71.4491]} // Центр Астаны
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Отображение отдельных жалоб */}
          {complaints.map((complaint) => (
            <Marker
              key={complaint.id}
              position={[complaint.lat, complaint.lon]}
            >
              <Popup>
                <div>
                  <strong>Жалоба #{complaint.id}</strong>
                  <br />
                  Категория: {complaint.category}
                  <br />
                  Статус: {complaint.status}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Отображение полигонов кластеров */}
          {clusters.map((cluster, index) => (
            <Polygon
              key={index}
              positions={cluster.polygon}
              pathOptions={{
                fillColor: '#2563eb',
                fillOpacity: 0.2,
                color: '#2563eb',
                opacity: 0.8,
                weight: 2
              }}
            />
          ))}
        </MapContainer>
      </div>
      
      <div style={{ 
        marginTop: '1rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#2563eb',
            borderRadius: '2px'
          }}></div>
          <span style={{ fontSize: '0.875rem' }}>Зоны скопления жалоб</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }}></div>
          <span style={{ fontSize: '0.875rem' }}>Отдельные жалобы</span>
        </div>
      </div>
    </div>
  );
};

export default CityMap;
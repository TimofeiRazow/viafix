// Алгоритм convex hull - Andrew's monotone chain
export function convexHull(points) {
  if (points.length <= 3) return points;
  
  points.sort((a, b) => a.lat - b.lat || a.lon - b.lon);
  
  const lower = [];
  for (const point of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }
  
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
      upper.pop();
    }
    upper.push(points[i]);
  }
  
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function cross(o, a, b) {
  return (a.lon - o.lon) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lon - o.lon);
}

// Создание сглаженного полигона с помощью алгоритма Chaikin
export function createSmoothPolygon(cluster) {
  const hull = convexHull(cluster);
  
  // Применяем алгоритм сглаживания Chaikin
  let smoothed = hull.map(point => [point.lat, point.lon]);
  
  for (let i = 0; i < 2; i++) {
    smoothed = chaikinSmooth(smoothed);
  }
  
  return {
    points: cluster,
    polygon: smoothed
  };
}

// Алгоритм сглаживания Chaikin
function chaikinSmooth(points) {
  const smoothed = [];
  
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    
    // Первая точка на 25% отрезка
    smoothed.push([
      current[0] * 0.75 + next[0] * 0.25,
      current[1] * 0.75 + next[1] * 0.25
    ]);
    
    // Вторая точка на 75% отрезка
    smoothed.push([
      current[0] * 0.25 + next[0] * 0.75,
      current[1] * 0.25 + next[1] * 0.75
    ]);
  }
  
  return smoothed;
}
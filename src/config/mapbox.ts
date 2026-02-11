// Mapbox public token - centralized for easy rotation
// To restrict: configure URL restrictions in Mapbox dashboard
const token = import.meta.env.VITE_MAPBOX_TOKEN;
if (!token) {
  console.warn('VITE_MAPBOX_TOKEN is not configured – map features will be unavailable.');
}
export const MAPBOX_TOKEN = token ?? '';

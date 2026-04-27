/**
 * Configuration API centralisée
 * Utilise une variable d'environnement ou une URL par défaut
 */

const VITE_API_URL = import.meta.env.VITE_API_URL;
const isDevelopment = import.meta.env.DEV;

let API_BASE_URL;

if (VITE_API_URL) {
  
  API_BASE_URL = VITE_API_URL.endsWith('/api') ? VITE_API_URL : `${VITE_API_URL}/api`;
} else if (isDevelopment) {
  // En développement, backend local
  API_BASE_URL = 'http://localhost:3000/api';
} else {
  // En production sur ticket-taf.itea.africa, 'API du même domaine
  API_BASE_URL = '/api';
}

export default API_BASE_URL;

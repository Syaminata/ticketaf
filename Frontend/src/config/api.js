/**
 * Configuration API centralisée
 * Utilise une variable d'environnement ou une URL par défaut
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🌐 API Base URL:', API_BASE_URL);

export default API_BASE_URL;

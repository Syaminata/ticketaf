import axios from './axios';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const statsAPI = {
  // Statistiques générales du dashboard
  getStats: async () => {
    const response = await axios.get('/stats', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Statistiques de revenus (period: today, week, month, year)
  getRevenue: async (period = 'month') => {
    const response = await axios.get(`/stats/revenue?period=${period}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Meilleurs chauffeurs par nombre de voyages
  getTopDrivers: async () => {
    const response = await axios.get('/stats/top-drivers', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Top 5 clients avec le plus de réservations
  getTopReservationsClients: async () => {
    const response = await axios.get('/stats/top-reservations-clients', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Top 5 destinations les plus populaires pour les colis
  getTopColisDestinations: async () => {
    const response = await axios.get('/stats/top-colis-destinations', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Top 5 clients expéditeurs de colis
  getTopClients: async () => {
    const response = await axios.get('/stats/top-clients', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Nombre de réservations d'un utilisateur
  getUserReservationsCount: async (userId) => {
    const response = await axios.get(`/stats/user-reservations/${userId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Données du graphique des réservations (7 derniers jours)
  getReservationsChart: async () => {
    const response = await axios.get('/reservations/chart', {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

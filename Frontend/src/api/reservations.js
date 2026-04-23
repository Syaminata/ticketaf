import axios from './axios';

export const reservationsAPI = {

  // Récupérer toutes les réservations (admin)
  getAllReservations: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/reservations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer les réservations de l'utilisateur connecté
  getMyReservations: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/reservations/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer les réservations d'un voyage
  getReservationsByVoyage: async (voyageId) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/reservations/voyage/${voyageId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer les réservations d'un bus
  getReservationsByBus: async (busId) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/reservations/bus/${busId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Statistiques des réservations (graphique 7 jours)
  getChartData: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/reservations/chart', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer une réservation par ID
  getReservationById: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Créer une réservation
  createReservation: async (reservationData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/reservations', reservationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Mettre à jour une réservation
  updateReservation: async (id, reservationData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/reservations/${id}`, reservationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Supprimer une réservation
  deleteReservation: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

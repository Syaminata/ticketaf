import axios from './axios';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const busesAPI = {
  // Récupérer tous les bus
  getAllBuses: async () => {
    const response = await axios.get('/buses', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Récupérer un bus par ID
  getBusById: async (id) => {
    const response = await axios.get(`/buses/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Récupérer les bus de l'entreprise connectée
  getMyBuses: async () => {
    const response = await axios.get('/buses/me', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Créer un bus
  createBus: async (busData) => {
    const response = await axios.post('/buses', busData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Mettre à jour un bus
  updateBus: async (id, busData) => {
    const response = await axios.put(`/buses/${id}`, busData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Supprimer un bus
  deleteBus: async (id) => {
    const response = await axios.delete(`/buses/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Activer un bus
  activateBus: async (id) => {
    const response = await axios.put(`/bus/${id}/activate`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Désactiver un bus
  deactivateBus: async (id) => {
    const response = await axios.put(`/bus/${id}/deactivate`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

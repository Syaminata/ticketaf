import axios from './axios';

const VILLE_API_URL = '/villes';

// Fonction utilitaire pour obtenir les en-têtes avec le token
const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  if (!token) {
    console.error('Aucun token trouvé dans le sessionStorage');
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const villeAPI = {
  // Récupérer toutes les villes
  getAllVilles: async () => {
    try {
      const response = await axios.get(VILLE_API_URL, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des villes:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Créer une nouvelle ville (admin)
  createVille: async (villeData) => {
    try {
      const response = await axios.post(VILLE_API_URL, villeData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la ville:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Mettre à jour une ville (admin)
  updateVille: async (id, villeData) => {
    try {
      const response = await axios.put(`${VILLE_API_URL}/${id}`, villeData, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la ville:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Supprimer une ville (admin)
  deleteVille: async (id) => {
    try {
      const response = await axios.delete(`${VILLE_API_URL}/${id}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la ville:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
};
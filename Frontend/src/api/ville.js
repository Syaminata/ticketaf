import axios from './axios';

const VILLE_API_URL = '/api/villes';

export const villeAPI = {
  // Récupérer toutes les villes
  getAllVilles: async () => {
    try {
      const response = await axios.get(VILLE_API_URL);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des villes:', error);
      throw error;
    }
  },

  // Créer une nouvelle ville (admin)
  createVille: async (villeData) => {
    try {
      const response = await axios.post(VILLE_API_URL, villeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la ville:', error);
      throw error;
    }
  },

  // Mettre à jour une ville (admin)
  updateVille: async (id, villeData) => {
    try {
      const response = await axios.put(`${VILLE_API_URL}/${id}`, villeData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la ville:', error);
      throw error;
    }
  },

  // Supprimer une ville (admin)
  deleteVille: async (id) => {
    try {
      const response = await axios.delete(`${VILLE_API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la ville:', error);
      throw error;
    }
  },

  // Activer/Désactiver une ville (admin)
  toggleVilleStatus: async (id) => {
    try {
      const response = await axios.patch(`${VILLE_API_URL}/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de statut de la ville:', error);
      throw error;
    }
  }
};

export default villeAPI;

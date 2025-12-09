import axios from './axios';

export const colisAPI = {
  // Récupérer tous les colis (admin) ou les colis de l'utilisateur
  getAllColis: async (filters = {}) => {
    const token = sessionStorage.getItem('token');
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.voyageId) params.append('voyageId', filters.voyageId);
    if (filters.expediteur) params.append('expediteur', filters.expediteur);
    
    const response = await axios.get(`/colis${params.toString() ? '?' + params.toString() : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer les colis de l'utilisateur connecté
  getUserColis: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/colis/user/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer un colis par ID
  getColisById: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/colis/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Créer un nouveau colis avec image
  createColis: async (formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/colis', formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Mettre à jour un colis
  updateColis: async (id, formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/colis/${id}`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Supprimer un colis
  deleteColis: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`/colis/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Annuler un colis
  cancelColis: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(
      `/colis/${id}/annuler`,
      {},
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  // Récupérer les statistiques des colis
  getColisStats: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/colis/stats/colis', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};
import axios from './axios';

const getAuthHeaders = (isFormData = false) => {
  const token = sessionStorage.getItem('token');
  const headers = {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const annoncesAPI = {
  // Récupérer toutes les annonces
  getAllAnnonces: async () => {
    const response = await axios.get('/annonces', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Créer une annonce (avec image)
  createAnnonce: async (formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/annonces', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Mettre à jour une annonce (avec image optionnelle)
  updateAnnonce: async (id, formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/annonces/${id}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Supprimer une annonce
  deleteAnnonce: async (id) => {
    const response = await axios.delete(`/annonces/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

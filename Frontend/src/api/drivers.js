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

export const driversAPI = {
  // Récupérer tous les conducteurs (admin)
  getAllDrivers: async () => {
    const response = await axios.get('/drivers', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Récupérer les chauffeurs épinglés/recommandés (public)
  getPinnedDrivers: async () => {
    const response = await axios.get('/drivers/pinned');
    return response.data;
  },

  // Récupérer un conducteur par ID
  getDriverById: async (id) => {
    const response = await axios.get(`/drivers/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Profil du conducteur connecté
  getMyProfile: async () => {
    const response = await axios.get('/drivers/me', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Inscription publique conducteur
  registerDriver: async (formData) => {
    const response = await axios.post('/drivers/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Créer un conducteur (admin)
  createDriver: async (formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/drivers', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Mettre à jour un conducteur (admin)
  updateDriver: async (id, formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/drivers/${id}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Modifier son propre profil (conducteur)
  updateMyProfile: async (formData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put('/drivers/me/profile', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Changer son mot de passe (conducteur)
  changeMyPassword: async (passwordData) => {
    const response = await axios.put('/drivers/me/password', passwordData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Supprimer un conducteur (admin)
  deleteDriver: async (id) => {
    const response = await axios.delete(`/drivers/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Épingler un chauffeur (admin)
  pinDriver: async (id, pinnedOrder) => {
    const response = await axios.patch(`/drivers/${id}/pin`,
      pinnedOrder !== undefined ? { pinnedOrder } : {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Désépingler un chauffeur (admin)
  unpinDriver: async (id) => {
    const response = await axios.patch(`/drivers/${id}/unpin`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Activer un conducteur (admin)
  activateDriver: async (id) => {
    const response = await axios.put(`/drivers/${id}/activate`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Désactiver un conducteur (admin)
  deactivateDriver: async (id) => {
    const response = await axios.put(`/drivers/${id}/deactivate`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Nettoyer les fichiers orphelins (admin)
  cleanFiles: async () => {
    const response = await axios.post('/drivers/clean-files', {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

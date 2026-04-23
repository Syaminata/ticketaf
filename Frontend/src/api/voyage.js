import axios from './axios';

export const voyageAPI = {

  // Récupérer tous les voyages futurs
  getAllVoyages: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/voyages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer tous les voyages y compris les expirés (historique)
  getAllVoyagesIncludingExpired: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/voyages/all/including-expired', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Rechercher des voyages (from, to, date)
  searchVoyages: async (params = {}) => {
    const token = sessionStorage.getItem('token');
    const queryParams = new URLSearchParams();
    if (params.from) queryParams.append('from', params.from);
    if (params.to) queryParams.append('to', params.to);
    if (params.date) queryParams.append('date', params.date);

    const response = await axios.get(`/voyages/search?${queryParams.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer les voyages du conducteur connecté
  getMyVoyages: async (includeExpired = false) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/voyages/me${includeExpired ? '?includeExpired=true' : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Récupérer un voyage par ID
  getVoyageById: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/voyages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Créer un voyage (admin)
  createVoyage: async (voyageData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/voyages', voyageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Créer un voyage (conducteur)
  createVoyageByDriver: async (voyageData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/voyages/driver', voyageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Mettre à jour un voyage
  updateVoyage: async (id, voyageData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/voyages/${id}`, voyageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Mettre à jour son propre voyage (conducteur)
  updateMyVoyage: async (id, voyageData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/voyages/my-voyages/${id}`, voyageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Supprimer un voyage
  deleteVoyage: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`/voyages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // [Admin] Récupérer tous les voyages
  adminGetAllVoyages: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/voyages/admin/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // [Admin] Supprimer un voyage
  adminDeleteVoyage: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`/voyages/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

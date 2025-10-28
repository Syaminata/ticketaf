import axios from './axios';

export const voyageAPI = {

  getAllVoyages: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/voyages', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  getVoyageById: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/voyages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  createVoyage: async (voyageData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/voyages', voyageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateVoyage: async (id, voyageData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/voyages/${id}`, voyageData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteVoyage: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`/voyages/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

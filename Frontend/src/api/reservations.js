import axios from './axios';

export const reservationsAPI = {
  
  getAllReservations: async () => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get('/reservations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  getReservationById: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.get(`/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },
  
  createReservation: async (reservationData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.post('/reservations', reservationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateReservation: async (id, reservationData) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.put(`/reservations/${id}`, reservationData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  deleteReservation: async (id) => {
    const token = sessionStorage.getItem('token');
    const response = await axios.delete(`/reservations/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
};

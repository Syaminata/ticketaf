import axios from './axios';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const usersAPI = {
  // Récupérer tous les utilisateurs (admin)
  getAllUsers: async () => {
    const response = await axios.get('/users', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Récupérer un utilisateur par ID
  getUserById: async (id) => {
    const response = await axios.get(`/users/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Créer un utilisateur (admin)
  createUser: async (userData) => {
    const response = await axios.post('/users', userData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Mettre à jour un utilisateur (admin)
  updateUser: async (id, userData) => {
    const response = await axios.put(`/users/${id}`, userData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Supprimer un utilisateur (admin)
  deleteUser: async (id) => {
    const response = await axios.delete(`/users/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Profil de l'utilisateur connecté
  getMyProfile: async () => {
    const response = await axios.get('/users/me', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Mettre à jour le profil
  updateProfile: async (profileData) => {
    const response = await axios.put('/users/profile', profileData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Changer le mot de passe
  changePassword: async (passwordData) => {
    const response = await axios.put('/users/change-password', passwordData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Supprimer son propre compte
  deleteMyAccount: async () => {
    const response = await axios.delete('/users/me', {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

// Exports pour compatibilité avec l'ancien code
export const getAllUsers = () => axios.get('/users', { headers: getAuthHeaders() });
export const createUser = (data) => axios.post('/users', data, { headers: getAuthHeaders() });
export const deleteUser = (id) => axios.delete(`/users/${id}`, { headers: getAuthHeaders() });

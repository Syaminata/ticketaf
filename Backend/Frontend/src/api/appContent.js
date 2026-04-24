import axios from './axios';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const appContentAPI = {
  // Récupérer tous les contenus
  getAllContents: async () => {
    const response = await axios.get('/app-content');
    return response.data;
  },

  // Récupérer un contenu par clé (privacy_policy, terms_conditions, about_app, contact_info)
  getContent: async (key) => {
    const response = await axios.get(`/app-content/${key}`);
    return response.data;
  },

  // Mettre à jour un contenu (admin)
  updateContent: async (key, contentData) => {
    const response = await axios.put(`/app-content/${key}`, contentData, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

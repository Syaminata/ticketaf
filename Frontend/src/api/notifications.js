import axios from './axios';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const notificationsAPI = {
  // Envoyer une notification
  sendNotification: async (notificationData) => {
    const response = await axios.post('/notifications/send', notificationData, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Historique des notifications envoyées
  getHistory: async () => {
    const response = await axios.get('/notifications/history', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Statistiques des notifications
  getStats: async () => {
    const response = await axios.get('/notifications/stats', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Notifications de l'utilisateur connecté
  getMyNotifications: async () => {
    const response = await axios.get('/notifications/my', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Compteur de notifications non lues
  getUnreadCount: async () => {
    const response = await axios.get('/notifications/my/unread-count', {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Détail d'une notification
  getNotificationById: async (id) => {
    const response = await axios.get(`/notifications/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Marquer une notification comme lue
  markAsRead: async (id) => {
    const response = await axios.put(`/notifications/${id}/read`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  // Envoyer les notifications du jour J
  sendDayJNotifications: async () => {
    const response = await axios.post('/notifications/dayj/send', {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

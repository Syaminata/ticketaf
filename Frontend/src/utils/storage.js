/**
 * Utilitaire de gestion du stockage de session
 * Utilise sessionStorage pour que les données expirent à la fermeture du navigateur
 */

const storage = {
  // Récupérer le token
  getToken: () => {
    return sessionStorage.getItem('token');
  },

  // Sauvegarder le token
  setToken: (token) => {
    sessionStorage.setItem('token', token);
  },

  // Supprimer le token
  removeToken: () => {
    sessionStorage.removeItem('token');
  },

  // Récupérer les données utilisateur
  getUser: () => {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Sauvegarder les données utilisateur
  setUser: (user) => {
    sessionStorage.setItem('user', JSON.stringify(user));
  },

  // Supprimer les données utilisateur
  removeUser: () => {
    sessionStorage.removeItem('user');
  },

  // Nettoyer toutes les données de session
  clear: () => {
    sessionStorage.clear();
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!sessionStorage.getItem('token');
  }
};

export default storage;

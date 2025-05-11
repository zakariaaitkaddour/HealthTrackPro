import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de base de votre backend
const BASE_URL = 'http://10.0.2.2:8080';

// Créer une instance d'axios avec des configurations par défaut
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs (par exemple, 403 Forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      console.error('Erreur 403 Forbidden : Accès interdit');
      // Vous pouvez rediriger vers l'écran de connexion ici
    } else if (error.response?.status === 401) {
      console.error('Erreur 401 Unauthorized : Token invalide ou expiré');
      // Vous pouvez rediriger vers l'écran de connexion ici
    }
    return Promise.reject(error);
  }
);

export default api;
import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextData {
  userToken: string | null;
  userRole: string | null;
  userName: string | null;
  userId: string | null;
  userEmail: string | null;
  loading: boolean;
  login: (jwt: string, role: string, userId: string, userEmail: string, userName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        const name = await AsyncStorage.getItem('userName');
        const id = await AsyncStorage.getItem('userId');
        const email = await AsyncStorage.getItem('userEmail');
        console.log('Données chargées depuis AsyncStorage :', { token, role, name, id, email }); // Ajouter ce log
        if (token && role) {
          setUserToken(token);
          setUserRole(role);
          setUserName(name);
          setUserId(id);
          setUserEmail(email);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données depuis AsyncStorage :', error);
      } finally {
        setLoading(false);
      }
    };
    loadStorageData();
  }, []);

  const login = async (jwt: string, role: string, userId: string, userEmail: string, userName: string) => {
    try {
      console.log('Appel de login avec :', { jwt, role, userId, userEmail, userName }); // Ajouter ce log
      await AsyncStorage.setItem('userToken', jwt);
      await AsyncStorage.setItem('userRole', role);
      await AsyncStorage.setItem('userName', userName || '');
      await AsyncStorage.setItem('userId', userId);
      await AsyncStorage.setItem('userEmail', userEmail);
      setUserToken(jwt);
      setUserRole(role);
      setUserName(userName);
      setUserId(userId);
      setUserEmail(userEmail);
    } catch (error) {
      console.error('Erreur lors de la connexion :', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userEmail');
      setUserToken(null);
      setUserRole(null);
      setUserName(null);
      setUserId(null);
      setUserEmail(null);
    } catch (error) {
      console.error('Erreur lors de la déconnexion :', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, userName, userId, userEmail, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
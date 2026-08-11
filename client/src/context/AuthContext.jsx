import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, loginUser as loginRequest } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('vorexa-token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await getCurrentUser();
        setUser(data.user);
      } catch {
        localStorage.removeItem('vorexa-token');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const { data } = await loginRequest(credentials);
    if (data.requires2FA) {
      return data; // { requires2FA: true, userId } — caller shows the code entry step
    }
    localStorage.setItem('vorexa-token', data.token);
    setUser(data.user);
    return data.user;
  };

  const completeLogin = (data) => {
    localStorage.setItem('vorexa-token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('vorexa-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, completeLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

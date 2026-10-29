import { createContext, useContext, useState } from 'react';
import api from './api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  
const [user, setUser] = useState(() => {
  try {
    const savedUser = localStorage.getItem('user');

    if (
      !savedUser ||
      savedUser === 'undefined' ||
      savedUser === 'null'
    ) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch (error) {
    console.error('Invalid saved user data:', error);
    localStorage.removeItem('user');
    return null;
  }
});


  const login = async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };
  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>;
}

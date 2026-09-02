import { create } from 'zustand';
import api from '../api/axios';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('vendix_user')) || null,
  
  setAuth: (userData) => {
    localStorage.setItem('vendix_user', JSON.stringify(userData));
    set({ user: userData });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('vendix_user');
      set({ user: null });
    }
  }
}));

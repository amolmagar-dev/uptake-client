import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          const { token, user } = response.data;
          
          localStorage.setItem('uptake_token', token);
          set({ user, token, isLoading: false });
          return true;
        } catch (error: any) {
          const message = error.response?.data?.error || 'Login failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(email, password, name);
          const { token, user } = response.data;
          
          localStorage.setItem('uptake_token', token);
          set({ user, token, isLoading: false });
          return true;
        } catch (error: any) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('uptake_token');
        set({ user: null, token: null, error: null });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('uptake_token');
        if (!token) {
          set({ user: null, token: null });
          return;
        }

        try {
          const response = await authApi.me();
          set({ user: response.data.user, token });
        } catch {
          localStorage.removeItem('uptake_token');
          set({ user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'uptake-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);


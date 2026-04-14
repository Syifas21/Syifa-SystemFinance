// ============================================
// PROJECT FINANCE - Auth Store (Zustand)
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'CEO' | 'FINANCE_ADMIN';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tabId: string;
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  checkAuth: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

// Generate unique tab ID
const generateTabId = () => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create tab ID from sessionStorage (unique per tab)
const getTabId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

// Custom storage that uses sessionStorage + tab-specific key
const createTabStorage = () => ({
  getItem: (name: string) => {
    const tabId = getTabId();
    const key = `${name}_${tabId}`;
    const str = sessionStorage.getItem(key);
    if (!str) return null;
    return JSON.parse(str);
  },
  setItem: (name: string, value: any) => {
    const tabId = getTabId();
    const key = `${name}_${tabId}`;
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    const tabId = getTabId();
    const key = `${name}_${tabId}`;
    sessionStorage.removeItem(key);
  },
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      tabId: getTabId(),

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const response = await fetch('http://localhost:3002/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (response.ok && data.success) {
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, message: data.message || 'Login gagal' };
          }
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return { success: false, message: 'Terjadi kesalahan koneksi' };
        }
      },

      logout: () => {
        const tabId = get().tabId;
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        // Clear session storage for this tab only
        sessionStorage.removeItem(`finance-auth-storage_${tabId}`);
      },

      setUser: (user: User, token: string) => {
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      checkAuth: () => {
        const { token, user } = get();
        return !!token && !!user;
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'finance-auth-storage',
      storage: createJSONStorage(() => createTabStorage()),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        tabId: state.tabId,
      }),
    }
  )
);

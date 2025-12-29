import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface Connection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  database_name: string;
  username: string;
  ssl: number;
}

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Connections
  connections: Connection[];
  selectedConnectionId: string | null;
  setConnections: (connections: Connection[]) => void;
  setSelectedConnection: (id: string | null) => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
  
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // Connections
  connections: [],
  selectedConnectionId: null,
  setConnections: (connections) => set({ connections }),
  setSelectedConnection: (id) => set({ selectedConnectionId: id }),
  
  // Toasts
  toasts: [],
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    // Auto remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  
  // Theme
  theme: 'dark',
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'dark' ? 'light' : 'dark',
    })),
}));


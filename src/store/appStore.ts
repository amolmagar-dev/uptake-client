import { create } from "zustand";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
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
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;
  setTheme: (theme: "dark" | "light") => void;
}

// Load theme from localStorage
const getInitialTheme = (): "dark" | "light" => {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") {
      return saved;
    }
  } catch (e) {
    console.error("Failed to load theme from localStorage:", e);
  }
  return "dark";
};

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
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === "dark" ? "light" : "dark";
      // Save to localStorage
      try {
        localStorage.setItem("theme", newTheme);
        // Apply CSS variables immediately
        applyTheme(newTheme);
      } catch (e) {
        console.error("Failed to save theme to localStorage:", e);
      }
      return { theme: newTheme };
    }),
  setTheme: (theme) =>
    set(() => {
      // Save to localStorage
      try {
        localStorage.setItem("theme", theme);
        // Apply CSS variables immediately
        applyTheme(theme);
      } catch (e) {
        console.error("Failed to save theme to localStorage:", e);
      }
      return { theme };
    }),
}));

// Apply theme CSS variables to document
export const applyTheme = (theme: "dark" | "light") => {
  const root = document.documentElement;

  // Set data-theme attribute for CSS selectors
  root.setAttribute("data-theme", theme);

  if (theme === "light") {
    root.style.setProperty("--color-bg-primary", "#ffffff");
    root.style.setProperty("--color-bg-secondary", "#f5f5f7");
    root.style.setProperty("--color-bg-tertiary", "#e8e8ed");
    root.style.setProperty("--color-bg-card", "#ffffff");
    root.style.setProperty("--color-bg-elevated", "#ffffff");

    root.style.setProperty("--color-text-primary", "#1d1d1f");
    root.style.setProperty("--color-text-secondary", "#6e6e73");
    root.style.setProperty("--color-text-muted", "#a1a1a6");

    root.style.setProperty("--color-border", "#d2d2d7");
    root.style.setProperty("--color-border-hover", "#c7c7cc");
  } else {
    // Dark theme (default)
    root.style.setProperty("--color-bg-primary", "#0a0a0f");
    root.style.setProperty("--color-bg-secondary", "#12121a");
    root.style.setProperty("--color-bg-tertiary", "#1a1a25");
    root.style.setProperty("--color-bg-card", "#16161f");
    root.style.setProperty("--color-bg-elevated", "#1e1e2a");

    root.style.setProperty("--color-text-primary", "#f0f0f5");
    root.style.setProperty("--color-text-secondary", "#a0a0b0");
    root.style.setProperty("--color-text-muted", "#606070");

    root.style.setProperty("--color-border", "#2a2a3a");
    root.style.setProperty("--color-border-hover", "#3a3a4a");
  }
};

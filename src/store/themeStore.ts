import { create } from "zustand";

export interface ThemeColors {
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
  accent: {
    primary: string;
    secondary: string;
    tertiary: string;
    warning: string;
    info: string;
  };
  border: {
    DEFAULT: string;
    hover: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  type: "preset" | "custom";
  colors: ThemeColors;
  typography: {
    fontFamily: string;
    monoFont: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const defaultTheme: Theme = {
  id: "cyberpunk",
  name: "Cyberpunk",
  type: "preset",
  colors: {
    bg: {
      primary: "#0a0a0f",
      secondary: "#12121a",
      tertiary: "#1a1a25",
      card: "#16161f",
      elevated: "#1e1e2a",
    },
    text: {
      primary: "#f0f0f5",
      secondary: "#a0a0b0",
      muted: "#606070",
    },
    accent: {
      primary: "#00f5d4",
      secondary: "#7b2cbf",
      tertiary: "#ff6b6b",
      warning: "#ffd93d",
      info: "#4cc9f0",
    },
    border: {
      DEFAULT: "#2a2a3a",
      hover: "#3a3a4a",
    },
    status: {
      success: "#00f5a0",
      error: "#ff4757",
      warning: "#ffa502",
    },
  },
  typography: {
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
    monoFont: "'JetBrains Mono', 'Fira Code', monospace",
  },
  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "24px",
  },
};

export const presets: Theme[] = [
  defaultTheme,
  {
    id: "light",
    name: "Light Mode",
    type: "preset",
    colors: {
      bg: {
        primary: "#ffffff",
        secondary: "#f5f5f7",
        tertiary: "#e8e8ed",
        card: "#ffffff",
        elevated: "#ffffff",
      },
      text: {
        primary: "#1d1d1f",
        secondary: "#6e6e73",
        muted: "#a1a1a6",
      },
      accent: {
        primary: "#007aff",
        secondary: "#5856d6",
        tertiary: "#ff2d55",
        warning: "#ffcc00",
        info: "#5ac8fa",
      },
      border: {
        DEFAULT: "#d2d2d7",
        hover: "#c7c7cc",
      },
      status: {
        success: "#34c759",
        error: "#ff3b30",
        warning: "#ff9500",
      },
    },
    typography: defaultTheme.typography,
    radius: defaultTheme.radius,
  },
  {
    id: "midnight",
    name: "Midnight",
    type: "preset",
    colors: {
      bg: {
        primary: "#0f172a",
        secondary: "#1e293b",
        tertiary: "#334155",
        card: "#1e293b",
        elevated: "#334155",
      },
      text: {
        primary: "#f8fafc",
        secondary: "#94a3b8",
        muted: "#64748b",
      },
      accent: {
        primary: "#38bdf8",
        secondary: "#818cf8",
        tertiary: "#f472b6",
        warning: "#fbbf24",
        info: "#22d3ee",
      },
      border: {
        DEFAULT: "#334155",
        hover: "#475569",
      },
      status: {
        success: "#4ade80",
        error: "#f87171",
        warning: "#fbbf24",
      },
    },
    typography: defaultTheme.typography,
    radius: defaultTheme.radius,
  },
  {
    id: "forest",
    name: "Forest",
    type: "preset",
    colors: {
      bg: {
        primary: "#051109",
        secondary: "#0b1f13",
        tertiary: "#142e1e",
        card: "#0b1f13",
        elevated: "#142e1e",
      },
      text: {
        primary: "#e6f5ea",
        secondary: "#8ab495",
        muted: "#557560",
      },
      accent: {
        primary: "#4ade80",
        secondary: "#22c55e",
        tertiary: "#166534",
        warning: "#facc15",
        info: "#0ea5e9",
      },
      border: {
        DEFAULT: "#1f422e",
        hover: "#2d5e42",
      },
      status: {
        success: "#4ade80",
        error: "#ef4444",
        warning: "#eab308",
      },
    },
    typography: defaultTheme.typography,
    radius: defaultTheme.radius,
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    type: "preset",
    colors: {
      bg: {
        primary: "#020412",
        secondary: "#070e26",
        tertiary: "#0f1c42",
        card: "#070e26",
        elevated: "#0f1c42",
      },
      text: {
        primary: "#e0f2fe",
        secondary: "#7dd3fc",
        muted: "#366e94",
      },
      accent: {
        primary: "#0ea5e9",
        secondary: "#0284c7",
        tertiary: "#0369a1",
        warning: "#fcd34d",
        info: "#38bdf8",
      },
      border: {
        DEFAULT: "#172554",
        hover: "#1e3a8a",
      },
      status: {
        success: "#34d399",
        error: "#f87171",
        warning: "#fbbf24",
      },
    },
    typography: defaultTheme.typography,
    radius: defaultTheme.radius,
  },
  {
    id: "sunset",
    name: "Sunset",
    type: "preset",
    colors: {
      bg: {
        primary: "#1a0505",
        secondary: "#2d0b0b",
        tertiary: "#451212",
        card: "#2d0b0b",
        elevated: "#451212",
      },
      text: {
        primary: "#fff1f2",
        secondary: "#fda4af",
        muted: "#9f1239",
      },
      accent: {
        primary: "#fb7185",
        secondary: "#e11d48",
        tertiary: "#be123c",
        warning: "#fbbf24",
        info: "#60a5fa",
      },
      border: {
        DEFAULT: "#5c1818",
        hover: "#881337",
      },
      status: {
        success: "#4ade80",
        error: "#fb7185",
        warning: "#fbbf24",
      },
    },
    typography: defaultTheme.typography,
    radius: defaultTheme.radius,
  },
];

interface ThemeState {
  currentThemeId: string;
  preferredFont: string;
  customTheme: Theme | null;
  activeTheme: Theme;
  setTheme: (id: string) => void;
  setFont: (font: string) => void;
  updateCustomTheme: (partial: Partial<Theme>) => void;
  resetCustomTheme: () => void;
  saveCustomTheme: () => void;
}

const getInitialThemeId = () => {
  try {
    return localStorage.getItem("theme_id") || "cyberpunk";
  } catch {
    return "cyberpunk";
  }
};

const getInitialFont = () => {
  try {
    return localStorage.getItem("theme_font") || "system";
  } catch {
    return "system";
  }
};

const getFontFamily = (fontId: string) => {
  switch (fontId) {
    case "outfit":
      return "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif";
    case "inter":
      return "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
    case "serif":
      return "Georgia, Cambria, 'Times New Roman', Times, serif";
    case "mono":
      return "'JetBrains Mono', 'Fira Code', monospace";
    case "system":
    default:
      return "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  }
};

const getInitialCustomTheme = () => {
  try {
    const saved = localStorage.getItem("custom_theme");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentThemeId: getInitialThemeId(),
  preferredFont: getInitialFont(),
  customTheme: getInitialCustomTheme(),
  activeTheme: defaultTheme, // Will be updated in effects or init

  setTheme: (id) => {
    const theme = presets.find((p) => p.id === id) || 
                 (id === "custom" ? get().customTheme : null) || 
                 defaultTheme;
    
    // Apply preferred font
    const font = get().preferredFont;
    const themeWithFont = {
      ...theme,
      typography: {
        ...theme.typography,
        fontFamily: getFontFamily(font),
      }
    };
    
    set({ currentThemeId: id, activeTheme: themeWithFont });
    applyTheme(themeWithFont);
    localStorage.setItem("theme_id", id);
  },

  setFont: (fontId) => {
    set({ preferredFont: fontId });
    localStorage.setItem("theme_font", fontId);
    
    // Re-apply current theme with new font
    const { currentThemeId, setTheme } = get();
    setTheme(currentThemeId);
  },

  updateCustomTheme: (partial) => {
    const currentCustom = get().customTheme || { ...defaultTheme, id: "custom", name: "Custom Theme", type: "custom" };
    const newCustom = { ...currentCustom, ...partial };
    
    set({ customTheme: newCustom, currentThemeId: "custom", activeTheme: newCustom });
    applyTheme(newCustom);
  },

  saveCustomTheme: () => {
    const { customTheme } = get();
    if (customTheme) {
      localStorage.setItem("custom_theme", JSON.stringify(customTheme));
      localStorage.setItem("theme_id", "custom");
    }
  },

  resetCustomTheme: () => {
    set({ customTheme: null });
    localStorage.removeItem("custom_theme");
    get().setTheme("cyberpunk");
  },
}));

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  
  // Set data-theme for DaisyUI and other theme-aware components
  // We use the theme ID directly, which allows DaisyUI built-in themes to work
  root.setAttribute("data-theme", theme.id);

  const setProp = (name: string, value: string) => {
    root.style.setProperty(name, value);
  };

  // Colors
  setProp("--color-bg-primary", theme.colors.bg.primary);
  setProp("--color-bg-secondary", theme.colors.bg.secondary);
  setProp("--color-bg-tertiary", theme.colors.bg.tertiary);
  setProp("--color-bg-card", theme.colors.bg.card);
  setProp("--color-bg-elevated", theme.colors.bg.elevated);

  setProp("--color-text-primary", theme.colors.text.primary);
  setProp("--color-text-secondary", theme.colors.text.secondary);
  setProp("--color-text-muted", theme.colors.text.muted);

  setProp("--color-accent-primary", theme.colors.accent.primary);
  setProp("--color-accent-secondary", theme.colors.accent.secondary);
  setProp("--color-accent-tertiary", theme.colors.accent.tertiary);
  setProp("--color-accent-warning", theme.colors.accent.warning);
  setProp("--color-accent-info", theme.colors.accent.info);

  setProp("--color-border", theme.colors.border.DEFAULT);
  setProp("--color-border-hover", theme.colors.border.hover);

  setProp("--color-success", theme.colors.status.success);
  setProp("--color-error", theme.colors.status.error);
  setProp("--color-warning", theme.colors.status.warning);

  // Typography
  setProp("--font-primary", theme.typography.fontFamily);
  setProp("--font-mono", theme.typography.monoFont);

  // Radius
  setProp("--radius-sm", theme.radius.sm);
  setProp("--radius-md", theme.radius.md);
  setProp("--radius-lg", theme.radius.lg);
  setProp("--radius-xl", theme.radius.xl);
};

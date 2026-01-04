import { create } from "zustand";

export interface Theme {
  id: string;
  name: string;
}

export const daisyThemes: Theme[] = [
  { id: "light", name: "Light" },
  { id: "dark", name: "Dark" },
  { id: "cupcake", name: "Cupcake" },
  { id: "bumblebee", name: "Bumblebee" },
  { id: "emerald", name: "Emerald" },
  { id: "corporate", name: "Corporate" },
  { id: "synthwave", name: "Synthwave" },
  { id: "retro", name: "Retro" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "valentine", name: "Valentine" },
  { id: "halloween", name: "Halloween" },
  { id: "garden", name: "Garden" },
  { id: "forest", name: "Forest" },
  { id: "aqua", name: "Aqua" },
  { id: "lofi", name: "Lofi" },
  { id: "pastel", name: "Pastel" },
  { id: "fantasy", name: "Fantasy" },
  { id: "wireframe", name: "Wireframe" },
  { id: "black", name: "Black" },
  { id: "luxury", name: "Luxury" },
  { id: "dracula", name: "Dracula" },
  { id: "cmyk", name: "Cmyk" },
  { id: "autumn", name: "Autumn" },
  { id: "business", name: "Business" },
  { id: "acid", name: "Acid" },
  { id: "lemonade", name: "Lemonade" },
  { id: "night", name: "Night" },
  { id: "coffee", name: "Coffee" },
  { id: "winter", name: "Winter" },
  { id: "dim", name: "Dim" },
  { id: "nord", name: "Nord" },
  { id: "sunset", name: "Sunset" },
];

interface ThemeState {
  currentThemeId: string;
  preferredFont: string;
  setTheme: (id: string) => void;
  setFont: (font: string) => void;
}

const getInitialThemeId = () => {
  try {
    return localStorage.getItem("theme_id") || "night";
  } catch {
    return "night";
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

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentThemeId: getInitialThemeId(),
  preferredFont: getInitialFont(),

  setTheme: (id) => {
    set({ currentThemeId: id });
    applyTheme(id, get().preferredFont);
    localStorage.setItem("theme_id", id);
  },

  setFont: (fontId) => {
    set({ preferredFont: fontId });
    localStorage.setItem("theme_font", fontId);
    applyTheme(get().currentThemeId, fontId);
  },
}));

export const applyTheme = (themeId: string, fontId: string) => {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeId);
  root.style.setProperty("--font-primary", getFontFamily(fontId));
};

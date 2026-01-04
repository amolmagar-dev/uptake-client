import React from "react";
import { useThemeStore, daisyThemes } from "../../store/themeStore";
import { Type } from "lucide-react";

export const ThemeSettings: React.FC = () => {
  const { currentThemeId, setTheme } = useThemeStore();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-base-content mb-4">DaisyUI Themes</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {daisyThemes.map((theme) => (
            <button
              key={theme.id}
              data-theme={theme.id}
              onClick={() => setTheme(theme.id)}
              className={`
                group relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all
                ${currentThemeId === theme.id 
                  ? "border-primary bg-primary/10" 
                  : "border-base-300 bg-base-100 hover:border-primary/50"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider truncate">
                  {theme.name}
                </span>
                {currentThemeId === theme.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full bg-primary border-2 border-base-100" />
                <div className="h-6 w-6 rounded-full bg-secondary border-2 border-base-100" />
                <div className="h-6 w-6 rounded-full bg-accent border-2 border-base-100" />
                <div className="h-6 w-6 rounded-full bg-neutral border-2 border-base-100" />
              </div>

              {/* Theme Preview Colors */}
              <div className="grid grid-cols-4 gap-1 h-2 w-full mt-1 rounded-full overflow-hidden">
                <div className="bg-primary" />
                <div className="bg-secondary" />
                <div className="bg-accent" />
                <div className="bg-neutral" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-base-content mb-4">Typography</h3>
        <FontSelector />
      </div>
    </div>
  );
};

const FontSelector: React.FC = () => {
  const { preferredFont, setFont } = useThemeStore();
  
  const fonts = [
    { id: "system", name: "System UI", desc: "Native & Fast" },
    { id: "outfit", name: "Outfit", desc: "Modern & Geometric" },
    { id: "inter", name: "Inter", desc: "Clean & Neutral" },
    { id: "serif", name: "Serif", desc: "Elegant" },
    { id: "mono", name: "Monospace", desc: "Technical" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {fonts.map((font) => (
        <FontCard
          key={font.id}
          id={font.id}
          name={font.name}
          description={font.desc}
          isActive={preferredFont === font.id}
          onClick={() => setFont(font.id)}
        />
      ))}
    </div>
  );
};

interface FontCardProps {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
}

const FontCard: React.FC<FontCardProps> = ({ id, name, description, isActive, onClick }) => {
  const getPreviewFont = (id: string) => {
    switch (id) {
      case "outfit": return "'Outfit', sans-serif";
      case "inter": return "'Inter', sans-serif";
      case "serif": return "serif";
      case "mono": return "'JetBrains Mono', monospace";
      default: return "inherit";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all
        ${
          isActive
            ? "border-primary bg-primary/5"
            : "border-base-300 bg-base-100 hover:border-primary/30"
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-base-200 ${isActive ? "text-primary" : "text-base-content/60"}`}>
          <Type size={16} />
        </div>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-primary" />
        )}
      </div>
      
      <div style={{ fontFamily: getPreviewFont(id) }}>
        <div className={`font-medium mb-0.5 ${isActive ? "text-primary" : "text-base-content"}`}>
          {name}
        </div>
        <div className="text-xs text-base-content/60">
          {description}
        </div>
      </div>
      
      <div className="mt-3 text-lg opacity-80" style={{ fontFamily: getPreviewFont(id) }}>
        Ag
      </div>
    </button>
  );
};

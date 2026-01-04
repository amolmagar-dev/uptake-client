import React from "react";
import { useThemeStore, presets, type Theme } from "../../store/themeStore";
import { Card } from "../../shared/components/ui/Card";
import { Button } from "../../shared/components/ui/Button";
import { Type } from "lucide-react";

export const ThemeSettings: React.FC = () => {
  const { currentThemeId, setTheme } = useThemeStore();

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Theme Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isActive={currentThemeId === theme.id}
              onClick={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </div>

      {currentThemeId === "custom" && (
        <div className="p-4 rounded-lg bg-bg-elevated border border-border">
          <p className="text-text-muted">Custom theme editor coming soon...</p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Typography</h3>
        <FontSelector />
      </div>
    </div>
  );
};

const FontSelector: React.FC = () => {
  const { preferredFont, setFont } = useThemeStore();
  
  const fonts = [
    { id: "system", name: "System UI", desc: "Native & Fast" },
    { id: "outfit", name: "Outfit", desc: "Modern & Geomeric" },
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
        w-full text-left p-4 rounded-xl border transition-all duration-200 group
        ${
          isActive
            ? "border-accent-primary ring-1 ring-accent-primary bg-bg-elevated"
            : "border-border hover:border-border-hover bg-bg-card hover:bg-bg-elevated"
        }
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg bg-bg-tertiary text-text-secondary group-hover:text-accent-primary transition-colors">
          <Type size={16} />
        </div>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_8px_var(--color-accent-primary)]" />
        )}
      </div>
      
      <div style={{ fontFamily: getPreviewFont(id) }}>
        <div className={`font-medium mb-0.5 ${isActive ? "text-accent-primary" : "text-text-primary"}`}>
          {name}
        </div>
        <div className="text-xs text-text-muted">
          {description}
        </div>
      </div>
      
      <div className="mt-3 text-lg opacity-80" style={{ fontFamily: getPreviewFont(id) }}>
        Ag
      </div>
    </button>
  );
};

interface ThemeCardProps {
  theme: Theme;
  isActive: boolean;
  onClick: () => void;
}

const ThemeCard: React.FC<ThemeCardProps> = ({ theme, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-200
        ${
          isActive
            ? "border-accent-primary ring-1 ring-accent-primary bg-bg-elevated"
            : "border-border hover:border-border-hover bg-bg-card hover:bg-bg-elevated"
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`font-medium ${isActive ? "text-accent-primary" : "text-text-primary"}`}>
          {theme.name}
        </span>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-accent-primary shadow-[0_0_8px_var(--color-accent-primary)]" />
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-full border border-border/10"
          style={{ backgroundColor: theme.colors.bg.primary }}
          title="Background Primary"
        />
        <div
          className="w-8 h-8 rounded-full border border-border/10"
          style={{ backgroundColor: theme.colors.bg.secondary }}
          title="Background Secondary"
        />
        <div
          className="w-8 h-8 rounded-full border border-border/10"
          style={{ backgroundColor: theme.colors.accent.primary }}
          title="Accent Primary"
        />
        <div
          className="w-8 h-8 rounded-full border border-border/10"
          style={{ backgroundColor: theme.colors.text.primary }}
          title="Text Primary"
        />
      </div>
    </button>
  );
};

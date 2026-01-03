import React from "react";
import { useThemeStore, presets, type Theme } from "../../store/themeStore";
import { Card } from "../../shared/components/ui/Card";
import { Button } from "../../shared/components/ui/Button";

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
    </div>
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

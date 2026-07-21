import React from "react";

interface WorkspaceHeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/** Slim toolbar header for full-bleed workspace pages (editors, AI workspace). */
export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({ title, description, actions, children, className = "" }) => (
  <div className={`flex items-center justify-between gap-3 h-14 px-4 border-b border-base-300 bg-base-100 shrink-0 ${className}`}>
    <div className="flex items-center gap-2 min-w-0">
      {title && <h2 className="type-h3 text-base-content truncate">{title}</h2>}
      {description && <span className="type-caption text-base-content/50 truncate">{description}</span>}
      {children}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

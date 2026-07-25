import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** Standard page header: title + optional description + right-aligned actions slot. */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, className = "" }) => (
  <div className={`flex flex-wrap items-start justify-between gap-4 mb-6 ${className}`}>
    <div className="min-w-0">
      <h1 className="type-display text-base-content">{title}</h1>
      {description && <p className="type-body text-base-content/60 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

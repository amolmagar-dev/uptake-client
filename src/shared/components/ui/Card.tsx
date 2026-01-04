import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  glow = false,
  padding = "md",
}) => {
  const paddingStyles = {
    none: "p-0",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  return (
    <div
      className={`
        card card-border bg-base-100
        ${hover ? "hover:shadow-xl transition-all duration-300" : ""}
        ${glow ? "hover:shadow-primary/20" : ""}
        ${className}
      `}
    >
      <div className={`${paddingStyles[padding]}`}>{children}</div>
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = "", action }) => {
  return (
    <div className={`card-title flex items-center justify-between mb-4 ${className}`}>
      <div className="text-lg font-semibold">{children}</div>
      {action && <div className="card-actions">{action}</div>}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = "" }) => {
  return <div className={`card-body p-0 ${className}`}>{children}</div>;
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, className = "" }) => {
  return (
    <div className={`stats shadow bg-base-100 border border-base-300 ${className}`}>
      <div className="stat">
        <div className="stat-figure text-primary">{icon}</div>
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value}</div>
        {trend && (
          <div className={`stat-desc flex items-center gap-1 ${trend.isPositive ? "text-success" : "text-error"}`}>
            <span>{trend.isPositive ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

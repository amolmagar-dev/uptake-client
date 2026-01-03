import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'md',
}) => {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        bg-[#16161f] border border-[#2a2a3a] rounded-xl
        ${paddingStyles[padding]}
        ${hover ? 'hover:border-[#3a3a4a] hover:shadow-lg transition-all duration-200' : ''}
        ${glow ? 'hover:shadow-[0_0_30px_rgba(0,245,212,0.1)]' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  action,
}) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="text-lg font-semibold text-[#f0f0f5]">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
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

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
}) => {
  return (
    <Card className={`${className}`} hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#a0a0b0] mb-1">{title}</p>
          <p className="text-2xl font-bold text-[#f0f0f5]">{value}</p>
          {trend && (
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                trend.isPositive ? 'text-[#00f5a0]' : 'text-[#ff4757]'
              }`}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-[#00f5d4]/10 to-[#7b2cbf]/10 text-[#00f5d4]">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};


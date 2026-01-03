import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]
    disabled:opacity-50 disabled:cursor-not-allowed
    transform active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-[#00f5d4] to-[#7b2cbf]
      text-[#0a0a0f] font-semibold
      hover:shadow-[0_0_20px_rgba(0,245,212,0.3)]
      focus:ring-[#00f5d4]
    `,
    secondary: `
      bg-[#1e1e2a] border border-[#2a2a3a]
      text-[#f0f0f5]
      hover:bg-[#2a2a3a] hover:border-[#3a3a4a]
      focus:ring-[#7b2cbf]
    `,
    ghost: `
      bg-transparent
      text-[#a0a0b0]
      hover:bg-[#1e1e2a] hover:text-[#f0f0f5]
      focus:ring-[#2a2a3a]
    `,
    danger: `
      bg-[#ff4757] bg-opacity-20 border border-[#ff4757]
      text-[#ff4757]
      hover:bg-opacity-30
      focus:ring-[#ff4757]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};


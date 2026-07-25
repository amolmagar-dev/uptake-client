import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = "",
  ...props
}) => {
  const variants = {
    primary: "btn-primary shadow-sm hover:shadow-primary/20",
    secondary: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-error",
    warning: "btn-warning",
  };

  const sizes = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} active:scale-[0.98] transition-transform duration-75 ${className} ${isLoading ? "btn-disabled" : ""}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="loading loading-spinner loading-xs" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

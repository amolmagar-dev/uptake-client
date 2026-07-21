import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
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
  };

  const sizes = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className} ${isLoading ? "btn-disabled" : ""}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <span className="loading loading-spinner loading-xs" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#a0a0b0] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#606070]">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full px-4 py-2.5 
            bg-[#1a1a25] border border-[#2a2a3a] rounded-lg
            text-[#f0f0f5] placeholder-[#606070]
            transition-all duration-200
            focus:border-[#00f5d4] focus:ring-2 focus:ring-[#00f5d4]/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-[#ff4757] focus:border-[#ff4757] focus:ring-[#ff4757]/20' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606070]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[#ff4757]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-[#606070]">{helperText}</p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#a0a0b0] mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full px-4 py-2.5 
          bg-[#1a1a25] border border-[#2a2a3a] rounded-lg
          text-[#f0f0f5] placeholder-[#606070]
          transition-all duration-200 resize-none
          focus:border-[#00f5d4] focus:ring-2 focus:ring-[#00f5d4]/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-[#ff4757] focus:border-[#ff4757] focus:ring-[#ff4757]/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#ff4757]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-[#606070]">{helperText}</p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[#a0a0b0] mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full px-4 py-2.5 
          bg-[#1a1a25] border border-[#2a2a3a] rounded-lg
          text-[#f0f0f5]
          transition-all duration-200
          focus:border-[#00f5d4] focus:ring-2 focus:ring-[#00f5d4]/20
          disabled:opacity-50 disabled:cursor-not-allowed
          cursor-pointer
          ${error ? 'border-[#ff4757] focus:border-[#ff4757] focus:ring-[#ff4757]/20' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-[#ff4757]">{error}</p>
      )}
    </div>
  );
};


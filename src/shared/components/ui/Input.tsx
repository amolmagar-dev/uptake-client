import React from 'react';
import ReactSelect from 'react-select';
import type { StylesConfig, GroupBase } from 'react-select';


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
          className="block text-sm font-medium text-text-secondary mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full px-4 py-2.5 
            bg-bg-tertiary border border-border rounded-lg
            text-text-primary placeholder-text-muted
            transition-all duration-200
            focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${error ? 'border-status-error focus:border-status-error focus:ring-status-error/20' : ''}
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
        <p className="mt-1.5 text-sm text-status-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
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
          bg-bg-tertiary border border-border rounded-lg
          text-text-primary placeholder-text-muted
          transition-all duration-200 resize-none
          focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-status-error focus:border-status-error focus:ring-status-error/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-status-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
};

// Option type for react-select
export interface SelectOption {
  value: string;
  label: string;
}

// Custom styles for react-select to match dynamic theme
export const selectStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: 'var(--color-bg-tertiary)',
    borderColor: state.isFocused ? 'var(--color-accent-primary)' : 'var(--color-border)',
    borderRadius: '0.5rem',
    padding: '0.125rem 0',
    // Simplifying shadow for now to use solid color for the ring
    boxShadow: state.isFocused ? '0 0 0 2px var(--color-accent-primary)' : 'none',
    transition: 'all 200ms',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--color-accent-primary)' : 'var(--color-border-hover)',
    },
    cursor: 'pointer',
    minHeight: '42px',
    color: 'var(--color-text-primary)',
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)', // Keep generic shadow for depth
    zIndex: 99999,
  }),

  menuList: (base) => ({
    ...base,
    padding: '4px',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected 
      ? 'var(--color-accent-primary)' 
      : state.isFocused 
        ? 'var(--color-bg-elevated)' 
        : 'transparent',
    color: state.isSelected ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
    borderRadius: '0.375rem',
    padding: '8px 12px',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: state.isSelected ? 'var(--color-accent-primary)' : 'var(--color-border)',
    },
  }),
  singleValue: (base) => ({
    ...base,
    color: 'var(--color-text-primary)',
  }),
  placeholder: (base) => ({
    ...base,
    color: 'var(--color-text-muted)',
  }),
  input: (base) => ({
    ...base,
    color: 'var(--color-text-primary)',
  }),
  indicatorSeparator: () => ({
    display: 'none',
  }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
    '&:hover': {
      color: 'var(--color-accent-primary)',
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--color-text-muted)',
    '&:hover': {
      color: 'var(--color-status-error)',
    },
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: 'var(--color-bg-elevated)', // altered to elevated
    borderRadius: '0.375rem',
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: 'var(--color-text-primary)',
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: 'var(--color-text-muted)',
    '&:hover': {
      backgroundColor: 'var(--color-status-error)',
      color: '#fff',
    },
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color: 'var(--color-text-muted)',
  }),
};

// Multi-select styles
export const multiSelectStyles: StylesConfig<SelectOption, true, GroupBase<SelectOption>> = {
  ...(selectStyles as unknown as StylesConfig<SelectOption, true, GroupBase<SelectOption>>),
};


interface SelectProps {
  label?: string;
  error?: string;
  options?: SelectOption[];
  value?: string | null;
  onChange?: ((value: string | null) => void) | ((e: React.ChangeEvent<HTMLSelectElement>) => void);
  placeholder?: string;
  isDisabled?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  isDisabled = false,
  disabled = false,
  isClearable = true,
  isSearchable = true,
  id,
  className,
  children,
}) => {
  const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const isActuallyDisabled = isDisabled || disabled;
  
  // If children are provided, use native select (backward compatibility)
  if (children) {
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
          value={value || ''}
          onChange={(e) => {
            if (onChange) {
              (onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void)(e);
            }
          }}
          disabled={isActuallyDisabled}
          className={`
            w-full px-4 py-2.5 
            bg-bg-tertiary border border-border rounded-lg
            text-text-primary
            transition-all duration-200
            focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            cursor-pointer
            ${error ? 'border-status-error focus:border-status-error focus:ring-status-error/20' : ''}
            ${className || ''}
          `}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1.5 text-sm text-status-error">{error}</p>
        )}
      </div>
    );
  }

  // Use react-select when options array is provided
  const selectOptions = options || [];
  const selectedOption = selectOptions.find(opt => opt.value === value) || null;

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
      <ReactSelect<SelectOption, false>
        inputId={inputId}
        options={selectOptions}
        value={selectedOption}
        onChange={(selected) => {
          if (onChange) {
            (onChange as (value: string | null) => void)(selected?.value ?? null);
          }
        }}
        placeholder={placeholder}
        isDisabled={isActuallyDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        styles={selectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#ff4757]">{error}</p>
      )}
    </div>
  );
};


interface MultiSelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string[];
  onChange?: (values: string[]) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  id?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  error,
  options,
  value = [],
  onChange,
  placeholder = 'Select...',
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  id,
}) => {
  const inputId = id || `multiselect-${Math.random().toString(36).substr(2, 9)}`;
  const selectedOptions = options.filter(opt => value.includes(opt.value));

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
      <ReactSelect<SelectOption, true>
        inputId={inputId}
        options={options}
        value={selectedOptions}
        onChange={(selected) => onChange?.(selected ? selected.map(s => s.value) : [])}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isMulti
        styles={multiSelectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
      {error && (
        <p className="mt-1.5 text-sm text-[#ff4757]">{error}</p>
      )}
    </div>
  );
};


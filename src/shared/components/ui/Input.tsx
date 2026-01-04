import React from "react";
import ReactSelect from "react-select";
import type { StylesConfig, GroupBase } from "react-select";

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
  className = "",
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <fieldset className="fieldset w-full">
      {label && <legend className="fieldset-legend">{label}</legend>}
      <div className="relative w-full">
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50">{leftIcon}</div>}
        <input
          id={inputId}
          className={`
            input w-full
            ${leftIcon ? "pl-10" : ""}
            ${rightIcon ? "pr-10" : ""}
            ${error ? "input-error" : "input-border"}
            ${className}
          `}
          {...props}
        />
        {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50">{rightIcon}</div>}
      </div>
      {error && <p className="fieldset-label text-error">{error}</p>}
      {helperText && !error && <p className="fieldset-label">{helperText}</p>}
    </fieldset>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, helperText, className = "", id, ...props }) => {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <fieldset className="fieldset w-full">
      {label && <legend className="fieldset-legend">{label}</legend>}
      <textarea
        id={inputId}
        className={`
          textarea w-full resize-none
          ${error ? "textarea-error" : "textarea-border"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
      {helperText && !error && <p className="fieldset-label">{helperText}</p>}
    </fieldset>
  );
};

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ label, description, error, className = "", id, ...props }) => {
  const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="flex flex-col gap-1">
      <label className={`flex items-start gap-3 cursor-pointer group ${className}`}>
        <div className="relative flex items-center mt-0.5">
          <input
            id={inputId}
            type="checkbox"
            className="checkbox checkbox-primary checkbox-sm border-base-300"
            {...props}
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-base-content group-hover:text-primary transition-colors">
            {label}
          </span>
          {description && <p className="text-xs text-base-content/50">{description}</p>}
        </div>
      </label>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
};

// Option type for react-select
export interface SelectOption {
  value: string;
  label: string;
}

// Custom styles for react-select to match DaisyUI 5
export const selectStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--color-base-100)",
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-base-300)",
    borderRadius: "var(--radius-field)",
    padding: "0",
    boxShadow: state.isFocused ? "0 0 0 1px var(--color-primary)" : "none",
    transition: "all 200ms",
    "&:hover": {
      borderColor: "var(--color-primary)",
    },
    cursor: "pointer",
    minHeight: "42px",
    color: "var(--color-base-content)",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "40px",
    display: "flex",
    alignItems: "center",
  }),
  menuPortal: (base) => ({ ...base, zIndex: 99999 }),
  menu: (base) => ({
    ...base,
    backgroundColor: "var(--color-base-200)",
    border: "1px solid var(--color-base-300)",
    borderRadius: "var(--radius-box)",
    boxShadow: "var(--shadow-lg)",
    zIndex: 99999,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
      ? "var(--color-base-300)"
      : "transparent",
    color: state.isSelected ? "var(--color-primary-content)" : "var(--color-base-content)",
    borderRadius: "var(--radius-field)",
    margin: "2px",
    padding: "8px 12px",
    cursor: "pointer",
  }),
  singleValue: (base) => ({
    ...base,
    color: "var(--color-base-content)",
    margin: "0",
  }),
  placeholder: (base) => ({
    ...base,
    color: "var(--color-base-content)",
    opacity: 0.5,
    margin: "0",
  }),
  input: (base) => ({
    ...base,
    color: "var(--color-base-content)",
    margin: "0",
    padding: "0",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? "var(--color-primary)" : "var(--color-base-content)",
    padding: "0 8px",
    "&:hover": { color: "var(--color-primary)" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "var(--color-base-content)",
    opacity: 0.5,
    padding: "0 8px",
    cursor: "pointer",
    "&:hover": {
      color: "var(--color-error)",
      opacity: 1,
    },
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
  placeholder = "Select...",
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

  if (children) {
    return (
      <fieldset className="fieldset w-full">
        {label && <legend className="fieldset-legend">{label}</legend>}
        <select
          id={inputId}
          value={value || ""}
          onChange={(e) => {
            if (onChange) {
              (onChange as (e: React.ChangeEvent<HTMLSelectElement>) => void)(e);
            }
          }}
          disabled={isActuallyDisabled}
          className={`
            select w-full
            ${error ? "select-error" : "select-border"}
            ${className || ""}
          `}
        >
          {children}
        </select>
        {error && <p className="fieldset-label text-error">{error}</p>}
      </fieldset>
    );
  }

  const selectOptions = options || [];
  const selectedOption = selectOptions.find((opt) => opt.value === value) || null;

  return (
    <fieldset className="fieldset w-full">
      {label && <legend className="fieldset-legend">{label}</legend>}
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
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
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
  placeholder = "Select...",
  isDisabled = false,
  isClearable = true,
  isSearchable = true,
  id,
}) => {
  const inputId = id || `multiselect-${Math.random().toString(36).substr(2, 9)}`;
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <fieldset className="fieldset w-full">
      {label && <legend className="fieldset-legend">{label}</legend>}
      <ReactSelect<SelectOption, true>
        inputId={inputId}
        options={options}
        value={selectedOptions}
        onChange={(selected) => onChange?.(selected ? selected.map((s) => s.value) : [])}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isMulti
        styles={multiSelectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
      {error && <p className="fieldset-label text-error">{error}</p>}
    </fieldset>
  );
};

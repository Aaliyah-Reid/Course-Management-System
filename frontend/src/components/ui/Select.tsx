import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, fullWidth = true, onChange, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;
    
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value);
      }
    };
    
    const baseSelectStyles = 'block w-full px-4 py-2 pr-10 rounded-md appearance-none focus:outline-none focus:ring-2 transition-all duration-200';
    const widthStyles = fullWidth ? 'w-full' : '';
    const errorStyles = error ? 'border-red-500 focus:ring-red-500' : 'border-theme-primary focus:ring-theme-secondary';
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label htmlFor={selectId} className="block mb-2 text-sm font-medium text-theme-text">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`${baseSelectStyles} ${widthStyles} ${errorStyles} ${className} bg-theme-background text-theme-text`}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-theme-text">
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
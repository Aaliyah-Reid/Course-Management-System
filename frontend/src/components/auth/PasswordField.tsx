import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Input from '../ui/Input';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { getPasswordStrength } from '../../utils/validation';

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  showStrengthIndicator?: boolean;
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label = 'Password', error, showStrengthIndicator = true, onChange, value = '', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(() => getPasswordStrength(value as string));

    const toggleShowPassword = () => {
      setShowPassword(!showPassword);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
      
      if (showStrengthIndicator) {
        setStrength(getPasswordStrength(e.target.value));
      }
    };

    const toggleIcon = showPassword ? (
      <EyeOff 
        className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" 
        onClick={toggleShowPassword}
      />
    ) : (
      <Eye 
        className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" 
        onClick={toggleShowPassword}
      />
    );

    return (
      <div>
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          label={label}
          error={error}
          rightIcon={toggleIcon}
          onChange={handleChange}
          value={value}
          {...props}
        />
        {showStrengthIndicator && value && <PasswordStrengthIndicator strength={strength} />}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';

export default PasswordField;
import React, { useState, useEffect } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { LoginFormData, LoginFormErrors } from '../../types/auth';
import { validateLoginForm } from '../../utils/validation';
import { saveLoginPreferences, getSavedLoginPreferences } from '../../utils/storage';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import PasswordField from './PasswordField';

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  isLoading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const savedPreferences = getSavedLoginPreferences();
    if (savedPreferences.rememberMe) {
      setFormData((prev) => ({
        ...prev,
        email: savedPreferences.email,
        rememberMe: true
      }));
    }
  }, []);

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [field]: value });
    
    if (touched[field]) {
      const newErrors = validateLoginForm({ ...formData, [field]: value });
      setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => () => {
    setTouched({ ...touched, [field]: true });
    const newErrors = validateLoginForm(formData);
    setErrors((prev) => ({ ...prev, [field]: newErrors[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateLoginForm(formData);
    setErrors(newErrors);
    setTouched({
      email: true,
      password: true,
      rememberMe: true
    });
    
    if (Object.keys(newErrors).length === 0) {
      if (formData.rememberMe) {
        saveLoginPreferences(formData.email, true);
      }
      
      onSubmit(formData);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.email && formData.password;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email address"
        type="email"
        placeholder="your.email@example.com"
        value={formData.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={errors.email}
        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
        required
        autoComplete="email"
        autoFocus
      />
      
      <PasswordField
        value={formData.password}
        onChange={handleChange('password')}
        onBlur={handleBlur('password')}
        error={errors.password}
        required
        autoComplete="current-password"
      />
      
      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          checked={formData.rememberMe}
          onChange={handleChange('rememberMe')}
        />
        
        <a 
          href="https://support.mona.uwi.edu/"
          target="_blank"
          rel="noopener noreferrer" 
          className="text-sm font-semibold text-theme-secondary hover:text-theme-secondary/90 transition-colors"
        >
          Forgot password?
        </a>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-500/10 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-500">{error}</h3>
            </div>
          </div>
        </div>
      )}
      
      <Button
        type="submit"
        fullWidth
        isLoading={isLoading}
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
};

export default LoginForm;
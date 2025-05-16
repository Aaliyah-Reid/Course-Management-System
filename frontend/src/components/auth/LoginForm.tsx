import React, { useState, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
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
    userId: '',
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
        userId: savedPreferences.userId,
        rememberMe: true
      }));
    }
  }, []);

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    if (touched[field] && field !== 'rememberMe') {
      const validationErrors = validateLoginForm(newFormData);
      setErrors(validationErrors);
    }
  };

  const handleBlur = (field: keyof Omit<LoginFormData, 'rememberMe'>) => () => {
    setTouched((prevTouched) => ({ ...prevTouched, [field]: true }));
    const validationErrors = validateLoginForm(formData);
    setErrors(validationErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validateLoginForm(formData);
    setErrors(newErrors);
    setTouched({
      userId: true,
      password: true,
    });
    
    if (Object.keys(newErrors).length === 0) {
      if (formData.rememberMe) {
        saveLoginPreferences(formData.userId, true);
      }
      
      onSubmit(formData);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && formData.userId && formData.password;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="User ID"
        type="text"
        placeholder="Enter your User ID"
        value={formData.userId}
        onChange={handleChange('userId')}
        onBlur={handleBlur('userId')}
        error={errors.userId}
        leftIcon={<UserCircleIcon className="h-5 w-5" />}
        required
        autoComplete="username"
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
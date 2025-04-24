import { LoginFormData, LoginFormErrors } from '../types/auth';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;
  if (password.length < 6) return 1;
  
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length >= 8 && hasNumber && hasUppercase && hasLowercase && hasSpecial) {
    return 4;
  }
  
  if (password.length >= 6 && (hasNumber || hasUppercase || hasSpecial)) {
    return 3;
  }
  
  return 2;
};

export const validateLoginForm = (data: LoginFormData): LoginFormErrors => {
  const errors: LoginFormErrors = {};
  
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return errors;
};
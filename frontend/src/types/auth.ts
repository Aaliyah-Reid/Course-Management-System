export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  bio?: string;
  phoneNumber?: string;
  timezone?: string;
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  email?: string;
  password?: string;
  general?: string;
}
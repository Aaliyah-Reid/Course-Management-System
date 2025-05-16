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
  userId: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginFormErrors {
  userId?: string;
  password?: string;
  general?: string;
}
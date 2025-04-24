export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
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

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
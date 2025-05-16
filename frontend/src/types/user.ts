export enum UserType {
  Student = 'student',
  Lecturer = 'lecturer',
  Admin = 'admin',
}

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType: UserType | null;
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
  // Add other user-specific fields if needed
} 
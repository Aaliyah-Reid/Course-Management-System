import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import LoginForm from './LoginForm';
import { LoginFormData } from '../../types/auth';

const LoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(undefined);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll show a "success" for valid combinations and errors for others
      // In a real app, you would make an actual API call to your auth endpoint
      if (data.email === 'demo@example.com' && data.password === 'password123') {
        console.log('Login successful', data);
        // Navigate to dashboard or other page
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center">
      <div className="p-6 sm:p-8 max-w-md w-full mx-auto bg-white rounded-xl shadow-sm sm:shadow-md transition-all transform hover:shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to access your LMS account</p>
        </div>
        
        <LoginForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          error={error}
        />
      </div>
      
      <div className="text-center mt-8 text-sm text-gray-600">
        <p>© {new Date().getFullYear()} LMS. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;
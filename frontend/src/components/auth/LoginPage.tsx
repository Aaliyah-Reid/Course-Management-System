import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import LoginForm from './LoginForm';
import { LoginFormData } from '../../types/auth';

interface LoginPageProps {
  onLoginSuccess: (userId: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(undefined);
    
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: data.userId, password: data.password }),
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('Login successful', responseData);
        // Store user data/token as needed
        // The backend sends { message: string, userId: number (or string) }
        // Make sure responseData.userId is a string if your onLoginSuccess expects a string.
        const fetchedUserId = responseData.userId ? responseData.userId.toString() : '';
        if (fetchedUserId) {
            onLoginSuccess(fetchedUserId);
        } else {
            setError('Login successful, but User ID was not returned.');
        }
      } else {
        setError(responseData.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again later.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-background text-theme-text flex flex-col justify-center theme-transition">
      <div className="p-6 sm:p-8 max-w-md w-full mx-auto bg-theme-background rounded-xl shadow-sm sm:shadow-md transition-all transform hover:shadow-lg border border-theme-primary/20">
        <div className="flex justify-center mb-6">
          <div className="relative overflow-hidden rounded-full p-3">
            <div 
              className="absolute inset-0 animate-gradient bg-[length:400%_400%]"
              style={{
                backgroundImage: `linear-gradient(135deg, 
                  var(--primary) 0%, 
                  var(--accent) 25%, 
                  var(--primary) 50%,
                  var(--accent) 75%,
                  var(--primary) 100%
                )`
              }}
            />
            <GraduationCap className="h-8 w-8 text-white relative z-10" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-theme-text mb-2">Welcome Back</h1>
          <p className="text-theme-text/70">Sign in to access your LMS account</p>
        </div>
        
        <LoginForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading}
          error={error}
        />
      </div>
      
      <div className="text-center mt-8 text-sm text-theme-text/70">
        <p>© {new Date().getFullYear()} LMS. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginPage;
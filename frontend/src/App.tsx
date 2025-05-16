import React, { useState, useEffect } from 'react';
import LoginPage from './components/auth/LoginPage';
import Header from './components/navigation/Header';
import Dashboard from './components/dashboard/Dashboard';
import CoursesPage from './components/courses/CoursesPage';
import CourseDetails from './components/courses/CourseDetails';
import ForumPage from './components/forums/ForumPage';
import AssignmentsPage from './components/assignments/AssignmentsPage';
import ProfilePage from './components/profile/ProfilePage';
import GradesPage from './components/grades/GradesPage';
import CalendarPage from './components/calendar/CalendarPage';
import ReportsPage from './components/reports/ReportsPage';
import PreferencesPage from './components/preferences/PreferencesPage';
import { Course } from './types/course';
import { mockCourses } from './data/mockData';
import { clearLoginPreferences, getSavedLoginPreferences, saveLoginPreferences } from './utils/storage'; // Import storage utils
import { UserType, User } from './types/user'; // Import UserType and User
import './styles/theme.css';

// Define UserType
// type UserType = 'student' | 'lecturer' | 'admin' | null;
type UserTypeOrNull = UserType | null; // Allow UserType to be null

type Page = 'dashboard' | 'courses' | 'forums' | 'assignments' | 'profile' | 'grades' | 'calendar' | 'reports' | 'preferences' | { type: 'course-details'; course: Course };

// Helper to infer user type from ID
const inferUserType = (userId: string): UserType | null => {
  if (!userId) return null;
  if (userId.startsWith('62')) return UserType.Student;
  if (userId.startsWith('3')) return UserType.Lecturer;
  if (userId.startsWith('1')) return UserType.Admin;
  return null; 
};

// A simple way to check for a "session"
const checkInitialAuth = (): { isAuthenticated: boolean; userId: string | null; userType: UserType | null } => {
  const prefs = getSavedLoginPreferences();
  const isAuthenticated = prefs.rememberMe && !!prefs.userId;
  const userId = isAuthenticated ? prefs.userId : null;
  const userType = isAuthenticated && userId ? inferUserType(userId) : null;
  return { isAuthenticated, userId, userType };
};

function App() {
  const initialAuth = checkInitialAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(initialAuth.isAuthenticated);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(initialAuth.userId);
  const [loggedInUserType, setLoggedInUserType] = useState<UserType | null>(initialAuth.userType);
  const [currentUserDetails, setCurrentUserDetails] = useState<User | null>(null); // New state for user details
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPage('dashboard');
      setLoggedInUserId(null); // Clear userId on logout/session expiry
      setLoggedInUserType(null); // Clear userType
      setCurrentUserDetails(null); // Clear user details
    }
  }, [isAuthenticated]);

  // Fetch user details when loggedInUserId changes
  useEffect(() => {
    if (loggedInUserId) {
      const fetchUserDetails = async () => {
        try {
          // Since we don't have a /users/{id} endpoint, create user details based on what we know
          // In a real app, you would fetch this data from a backend endpoint
          const userDetails: User = {
            id: loggedInUserId,
            firstName: 'User', // Default value
            lastName: loggedInUserId, // Use ID as last name for display
            email: `${loggedInUserId}@example.com`, // Default email
            userType: loggedInUserType,
          };
          setCurrentUserDetails(userDetails);
        } catch (error) {
          console.error("Error setting user details:", error);
        }
      };
      fetchUserDetails();
    } else {
      setCurrentUserDetails(null);
    }
  }, [loggedInUserId, loggedInUserType]);

  const handleLoginSuccess = (userId: string) => {
    setIsAuthenticated(true);
    setLoggedInUserId(userId);
    const userType = inferUserType(userId);
    setLoggedInUserType(userType);
    // Save to localStorage if rememberMe was checked (LoginForm handles this part already for its own state)
    // To ensure consistency, we can re-save it here or rely on LoginForm's save
    // For now, assume LoginForm handles the rememberMe persistence of userId.
    // However, if the user didn't check rememberMe, the userId won't be in localStorage for the next session,
    // but it will be in the App state for the current session.
    // loggedInUserId will trigger the useEffect to fetch user details
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    // loggedInUserId and loggedInUserType will be cleared by the useEffect hook
    clearLoginPreferences();
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const handleNavigate = (page: 'dashboard' | 'courses' | 'forums' | 'assignments' | 'profile' | 'grades' | 'calendar' | 'reports' | 'preferences') => {
    setCurrentPage(page);
  };

  const handleCourseSelect = (course: Course) => {
    setCurrentPage({ type: 'course-details', course });
  };

  return (
    <div className="min-h-screen bg-theme-background text-theme-text">
      <Header 
        onNavigate={handleNavigate} 
        currentPage={typeof currentPage === 'string' ? currentPage : 'courses'} 
        onLogout={handleLogout} // Pass logout handler
        firstName={currentUserDetails?.firstName || null}
        lastName={currentUserDetails?.lastName || null}
      />
      <main className="mt-16 min-h-screen">
        {typeof currentPage === 'string' ? (
          currentPage === 'dashboard' ? (
            <Dashboard 
              onCourseSelect={handleCourseSelect} 
              userId={loggedInUserId}
              userType={loggedInUserType}
            />
          ) : currentPage === 'courses' ? (
            <CoursesPage 
              onCourseSelect={handleCourseSelect} 
              userId={loggedInUserId} 
              userType={loggedInUserType} 
            />
          ) : currentPage === 'forums' ? (
            <ForumPage currentUser={currentUserDetails} />
          ) : currentPage === 'assignments' ? (
            <AssignmentsPage userId={loggedInUserId} userType={loggedInUserType} />
          ) : currentPage === 'grades' ? (
            <GradesPage currentUser={currentUserDetails} />
          ) : currentPage === 'calendar' ? (
            <CalendarPage 
              userId={loggedInUserId} 
              userType={loggedInUserType} 
              onCourseSelect={handleCourseSelect}
            />
          ) : currentPage === 'reports' ? (
            <ReportsPage userId={loggedInUserId} userType={loggedInUserType} />
          ) : currentPage === 'preferences' ? (
            <PreferencesPage />
          ) : (
            // Default to ProfilePage if currentPage is a string but doesn't match known pages
            // This case might need refinement based on actual navigation logic for 'profile'
            currentPage === 'profile' ? <ProfilePage user={currentUserDetails} userId={loggedInUserId} userType={loggedInUserType} /> : <Dashboard onCourseSelect={handleCourseSelect} userId={loggedInUserId} userType={loggedInUserType} />
          )
        ) : (
          <CourseDetails course={currentPage.course} userId={loggedInUserId} userType={loggedInUserType} />
        )}
      </main>
    </div>
  );
}

export default App;
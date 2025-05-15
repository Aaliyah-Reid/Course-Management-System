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
import { clearLoginPreferences, getSavedLoginPreferences } from './utils/storage'; // Import storage utils
import './styles/theme.css';

type Page = 'dashboard' | 'courses' | 'forums' | 'assignments' | 'profile' | 'grades' | 'calendar' | 'reports' | 'preferences' | { type: 'course-details'; course: Course };

// A simple way to check for a "session"
const checkInitialAuth = () => {
  // In a real app, this might involve checking a token in localStorage or an HttpOnly cookie
  // For this demo, we'll consider "rememberMe" as a proxy for being logged in.
  const prefs = getSavedLoginPreferences();
  return prefs.rememberMe && !!prefs.email; // Logged in if remembered and email exists
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkInitialAuth);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  useEffect(() => {
    // If not authenticated and was trying to access a page, redirect to dashboard or clear page state
    // This handles the case where localStorage state changes (e.g. cleared manually)
    if (!isAuthenticated) {
      setCurrentPage('dashboard'); // Or set to a specific "logged out" page if you add one
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard'); // Navigate to dashboard on login
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearLoginPreferences(); // Clear remember me and email
    // LoginPage will be rendered due to isAuthenticated being false
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
      />
      <main className="mt-16 min-h-screen">
        {typeof currentPage === 'string' ? (
          currentPage === 'dashboard' ? (
            <Dashboard onCourseSelect={handleCourseSelect} />
          ) : currentPage === 'courses' ? (
            <CoursesPage onCourseSelect={handleCourseSelect} />
          ) : currentPage === 'forums' ? (
            <ForumPage />
          ) : currentPage === 'assignments' ? (
            <AssignmentsPage />
          ) : currentPage === 'grades' ? (
            <GradesPage />
          ) : currentPage === 'calendar' ? (
            <CalendarPage onEventClick={(courseCode) => {
              const course = mockCourses.find(c => c.code === courseCode);
              if (course) handleCourseSelect(course);
            }} />
          ) : currentPage === 'reports' ? (
            <ReportsPage />
          ) : currentPage === 'preferences' ? (
            <PreferencesPage />
          ) : (
            // Default to ProfilePage if currentPage is a string but doesn't match known pages
            // This case might need refinement based on actual navigation logic for 'profile'
            currentPage === 'profile' ? <ProfilePage /> : <Dashboard onCourseSelect={handleCourseSelect} />
          )
        ) : (
          <CourseDetails course={currentPage.course} />
        )}
      </main>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import LoginPage from './components/auth/LoginPage';
import Header from './components/navigation/Header';
import Dashboard from './components/dashboard/Dashboard';
import CoursesPage from './components/courses/CoursesPage';
import CourseDetails from './components/courses/CourseDetails';
import { Course } from './types/course';

type Page = 'dashboard' | 'courses' | { type: 'course-details'; course: Course };

function App() {
  const isAuthenticated = true;
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigate = (page: 'dashboard' | 'courses') => {
    setCurrentPage(page);
  };

  const handleCourseSelect = (course: Course) => {
    setCurrentPage({ type: 'course-details', course });
  };

  return (
    <>
      <Header 
        onNavigate={handleNavigate} 
        currentPage={typeof currentPage === 'string' ? currentPage : 'courses'} 
      />
      <main className="mt-16 min-h-screen bg-gray-50">
        {typeof currentPage === 'string' ? (
          currentPage === 'dashboard' ? (
            <Dashboard onCourseSelect={handleCourseSelect} />
          ) : (
            <CoursesPage onCourseSelect={handleCourseSelect} />
          )
        ) : (
          <CourseDetails course={currentPage.course} />
        )}
      </main>
    </>
  );
}

export default App;
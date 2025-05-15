import React, { useState } from 'react';
import CourseGrid from './CourseGrid';
import { Course } from '../../types/course';

interface CoursesPageProps {
  onCourseSelect: (course: Course) => void;
}

const CoursesPage: React.FC<CoursesPageProps> = ({ onCourseSelect }) => {
  const [isGridView, setIsGridView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'lastAccessed'>('lastAccessed');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-theme-text">My Courses</h1>
        <p className="mt-1 text-sm text-theme-text/70">Manage and access your enrolled courses</p>
      </div>

      <CourseGrid
        isGridView={isGridView}
        currentPage={currentPage}
        sortBy={sortBy}
        searchQuery={searchQuery}
        onViewToggle={() => setIsGridView(!isGridView)}
        onPageChange={setCurrentPage}
        onSortChange={setSortBy}
        onSearchChange={setSearchQuery}
        onCourseSelect={onCourseSelect}
      />
    </div>
  );
};

export default CoursesPage;
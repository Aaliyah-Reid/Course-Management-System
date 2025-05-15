import React from 'react';
import { ViewColumnsIcon, ListBulletIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import CourseCard from '../dashboard/courses/CourseCard';
import { mockCourses } from '../../data/mockData';
import { Course } from '../../types/course';

interface CourseGridProps {
  isGridView: boolean;
  currentPage: number;
  sortBy: 'name' | 'code' | 'lastAccessed';
  searchQuery: string;
  onViewToggle: () => void;
  onPageChange: (page: number) => void;
  onSortChange: (sort: 'name' | 'code' | 'lastAccessed') => void;
  onSearchChange: (query: string) => void;
  onCourseSelect: (course: Course) => void;
}

const CourseGrid: React.FC<CourseGridProps> = ({
  isGridView,
  currentPage,
  sortBy,
  searchQuery,
  onViewToggle,
  onPageChange,
  onSortChange,
  onSearchChange,
  onCourseSelect,
}) => {
  const itemsPerPage = 9;
  const filteredCourses = mockCourses
    .filter(course => 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'code') return a.code.localeCompare(b.code);
      return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
    });

  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const currentCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-theme-text/50" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-theme-primary rounded-md bg-theme-background text-theme-text placeholder:text-theme-text/50 focus:ring-2 focus:ring-theme-secondary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'name' | 'code' | 'lastAccessed')}
            className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
          >
            <option value="lastAccessed">Last Accessed</option>
            <option value="name">Course Name</option>
            <option value="code">Course Code</option>
          </select>

          <button
            onClick={onViewToggle}
            className="p-1.5 hover:bg-theme-secondary/10 rounded-lg text-theme-text"
          >
            {isGridView ? (
              <ListBulletIcon className="h-5 w-5" />
            ) : (
              <ViewColumnsIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div className={`
        ${isGridView 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }
      `}>
        {currentCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isGridView={isGridView}
            onClick={() => onCourseSelect(course)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-theme-primary/20 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-theme-primary bg-theme-secondary px-4 py-2 text-sm font-medium text-white hover:bg-theme-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-theme-primary bg-theme-secondary px-4 py-2 text-sm font-medium text-white hover:bg-theme-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-theme-text">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredCourses.length)}
                </span>{' '}
                of <span className="font-medium">{filteredCourses.length}</span> courses
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => onPageChange(idx + 1)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === idx + 1
                        ? 'bg-theme-secondary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-theme-secondary'
                        : 'text-theme-text ring-1 ring-inset ring-theme-primary hover:bg-theme-secondary/10 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseGrid;
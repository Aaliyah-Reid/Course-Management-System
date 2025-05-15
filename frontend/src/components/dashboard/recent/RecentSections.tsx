import React from 'react';
import { BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Course } from '../../../types/course';

interface RecentSectionsProps {
  onCourseSelect: (course: Course) => void;
}

const RecentSections: React.FC<RecentSectionsProps> = ({ onCourseSelect }) => {
  // Mock recent sections data
  const recentSections = [
    {
      id: '1',
      title: 'Introduction to Programming',
      courseCode: 'CS101',
      courseName: 'Introduction to Computer Science',
      lastAccessed: '2024-03-15T10:30:00Z',
      type: 'lecture',
      progress: 75
    },
    {
      id: '2',
      title: 'Matrices and Determinants',
      courseCode: 'MATH201',
      courseName: 'Linear Algebra',
      lastAccessed: '2024-03-14T15:45:00Z',
      type: 'assignment',
      progress: 30
    },
    {
      id: '3',
      title: 'Binary Search Trees',
      courseCode: 'CS202',
      courseName: 'Data Structures',
      lastAccessed: '2024-03-14T09:20:00Z',
      type: 'lecture',
      progress: 100
    }
  ];

  return (
    <div className="bg-theme-background rounded-lg shadow theme-transition">
      <div className="px-4 py-5 sm:p-6">
        <h2 className="text-lg font-semibold text-theme-text mb-4">Recently Accessed</h2>
        <div className="space-y-4">
          {recentSections.map((section) => (
            <div
              key={section.id}
              className="flex items-start space-x-4 p-4 rounded-lg border border-theme-primary/20 hover:bg-theme-primary/5 transition-colors cursor-pointer"
              onClick={() => onCourseSelect({
                id: section.id,
                name: section.courseName,
                code: section.courseCode,
                lastAccessed: section.lastAccessed
              })}
            >
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                  <BookOpenIcon className="h-6 w-6 text-theme-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-theme-text truncate">
                    {section.title}
                  </p>
                  <div className="flex items-center text-sm text-theme-text/70">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {format(new Date(section.lastAccessed), 'MMM d, h:mm a')}
                  </div>
                </div>
                <p className="mt-1 text-sm text-theme-text/70">
                  {section.courseCode} - {section.courseName}
                </p>
                <div className="mt-2">
                  <div className="flex items-center">
                    <div className="flex-1 bg-theme-accent/10 rounded-full h-2">
                      <div
                        className="bg-theme-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${section.progress}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-theme-text/70">
                      {section.progress}% complete
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentSections;
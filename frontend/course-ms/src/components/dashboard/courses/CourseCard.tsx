import React from 'react';
import { format } from 'date-fns';
import { ArrowRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Course } from '../../../types/course';

interface CourseCardProps {
  course: Course;
  isGridView: boolean;
  onClick: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, isGridView, onClick }) => {
  if (!isGridView) {
    return (
      <div 
        className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
            <p className="text-sm text-gray-500">
              {course.code} • Last accessed {format(new Date(course.lastAccessed), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <button className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-gray-100">
          <ArrowRightIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="h-32 bg-indigo-100 rounded-t-lg flex items-center justify-center">
        <BookOpenIcon className="h-12 w-12 text-indigo-600" />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{course.code}</p>
        <p className="text-xs text-gray-400 mt-2">
          Last accessed {format(new Date(course.lastAccessed), 'MMM d, yyyy')}
        </p>
        <button className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
          Open Course
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
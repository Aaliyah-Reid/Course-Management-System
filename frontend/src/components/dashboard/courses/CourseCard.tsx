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
        className="flex items-center justify-between p-4 bg-theme-background rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-theme-primary/20"
        onClick={onClick}
      >
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg relative overflow-hidden">
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
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpenIcon className="h-8 w-8 text-white/20" />
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium text-theme-text">{course.coursename}</h3>
            <p className="text-sm text-theme-text/70">
              {course.coursecode} {course.lecturerName ? `• ${course.lecturerName}` : '• No lecturer assigned'}
            </p>
          </div>
        </div>
        <button className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-theme-secondary/10">
          <ArrowRightIcon className="h-5 w-5 text-theme-text/50" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-theme-background rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-theme-primary/20"
      onClick={onClick}
    >
      <div className="h-32 rounded-t-lg relative overflow-hidden">
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
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpenIcon className="h-20 w-20 text-white/20" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-theme-text">{course.coursename}</h3>
        <p className="text-sm text-theme-text/70 mt-1">{course.coursecode}</p>
        <p className="text-xs text-theme-text/50 mt-2">
          {course.lecturerName ? `Lecturer: ${course.lecturerName}` : 'No lecturer assigned'}
        </p>
        <button className="mt-4 w-full flex items-center justify-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-theme-secondary hover:bg-theme-secondary/90 transition-colors">
          Open Course
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
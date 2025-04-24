import React from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface CourseAssignmentsProps {
  courseCode: string;
}

const CourseAssignments: React.FC<CourseAssignmentsProps> = ({ courseCode }) => {
  // Mock data - replace with actual data from your backend
  const assignments = [
    {
      id: '1',
      title: 'Assignment 1',
      dueDate: '2024-04-01T23:59:59Z',
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Assignment 2',
      dueDate: '2024-04-15T23:59:59Z',
      status: 'upcoming',
    },
  ];

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
            <span className={`
              inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              ${assignment.status === 'upcoming'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
              }
            `}>
              {assignment.status}
            </span>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            <span>Due {format(new Date(assignment.dueDate), 'PPP')}</span>
            <ClockIcon className="ml-4 mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
            <span>{format(new Date(assignment.dueDate), 'p')}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseAssignments;
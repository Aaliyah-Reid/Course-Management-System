import React, { useState } from 'react';
import { format } from 'date-fns';
import { Assignment } from '../../types/assignment';
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

// Mock data - replace with actual data from your backend
const mockAssignments: Assignment[] = [
  {
    id: 1,
    courseCode: 'CS101',
    title: 'Introduction to Programming Assignment',
    content: 'Create a simple calculator program using Python',
    dueDate: '2024-04-01T23:59:59Z',
    status: 'pending',
  },
  {
    id: 2,
    courseCode: 'MATH201',
    title: 'Linear Algebra Quiz',
    content: 'Complete the online quiz on matrices and determinants',
    dueDate: '2024-03-25T23:59:59Z',
    status: 'submitted',
  },
  {
    id: 3,
    courseCode: 'CS202',
    title: 'Data Structures Project',
    content: 'Implement a balanced binary search tree',
    dueDate: '2024-03-20T23:59:59Z',
    status: 'graded',
    score: 95,
  },
];

const AssignmentsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'courseCode'>('dueDate');

  const filteredAssignments = mockAssignments
    .filter(assignment => filter === 'all' || assignment.status === filter)
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.courseCode.localeCompare(b.courseCode);
    });

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-theme-accent" />;
      case 'submitted':
        return <CheckCircleIcon className="h-5 w-5 text-theme-secondary" />;
      case 'graded':
        return <CheckCircleIcon className="h-5 w-5 text-theme-primary" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-theme-text">Assignments</h1>
          <p className="mt-2 text-sm text-theme-text/70">
            View and manage your course assignments
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
          >
            <option value="all">All Assignments</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="courseCode">Sort by Course</option>
          </select>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-theme-primary/20 sm:rounded-lg">
              <table className="min-w-full divide-y divide-theme-primary/20">
                <thead className="bg-theme-primary/5">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-theme-text sm:pl-6">
                      Assignment
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                      Course
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                      Due Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-primary/20 bg-theme-background">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-theme-text sm:pl-6">
                        {assignment.title}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                        {assignment.courseCode}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                        {format(new Date(assignment.dueDate), 'MMM d, yyyy h:mm a')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                        <div className="flex items-center">
                          {getStatusIcon(assignment.status)}
                          <span className="ml-2 capitalize">{assignment.status}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                        {assignment.score !== undefined ? `${assignment.score}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
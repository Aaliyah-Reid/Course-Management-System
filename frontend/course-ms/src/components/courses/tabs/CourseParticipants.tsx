import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

interface CourseParticipantsProps {
  courseCode: string;
}

const CourseParticipants: React.FC<CourseParticipantsProps> = ({ courseCode }) => {
  // Mock data - replace with actual data from your backend
  const participants = [
    { id: '1', firstName: 'John', lastName: 'Doe', role: 'lecturer' },
    { id: '2', firstName: 'Jane', lastName: 'Smith', role: 'student' },
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {participants.map((participant) => (
              <tr key={participant.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="font-medium text-gray-900">
                        {participant.firstName} {participant.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <span className="capitalize">{participant.role}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseParticipants;
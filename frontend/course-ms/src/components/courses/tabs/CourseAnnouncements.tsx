import React from 'react';
import { format } from 'date-fns';

interface CourseAnnouncementsProps {
  courseCode: string;
}

const CourseAnnouncements: React.FC<CourseAnnouncementsProps> = ({ courseCode }) => {
  // Mock data - replace with actual data from your backend
  const announcements = [
    {
      id: '1',
      title: 'Welcome to the Course',
      content: 'Welcome to our course! Please review the syllabus and course schedule.',
      createdAt: '2024-03-15T10:00:00Z',
      author: 'Dr. Smith',
    },
    {
      id: '2',
      title: 'First Assignment Posted',
      content: 'The first assignment has been posted. Please check the assignments tab.',
      createdAt: '2024-03-16T14:30:00Z',
      author: 'Dr. Smith',
    },
  ];

  return (
    <div className="space-y-6">
      {announcements.map((announcement) => (
        <div
          key={announcement.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
            <span className="text-sm text-gray-500">
              {format(new Date(announcement.createdAt), 'PPP')}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">{announcement.content}</p>
          <div className="mt-4 text-sm text-gray-500">
            Posted by {announcement.author}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseAnnouncements;
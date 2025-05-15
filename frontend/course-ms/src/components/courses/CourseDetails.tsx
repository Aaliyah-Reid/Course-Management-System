import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { Course } from '../../types/course';
import CourseContent from './tabs/CourseContent';
import CourseParticipants from './tabs/CourseParticipants';
import CourseAssignments from './tabs/CourseAssignments';
import CourseAnnouncements from './tabs/CourseAnnouncements';

interface CourseDetailsProps {
  course: Course;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course }) => {
  const tabs = [
    { name: 'Course', component: CourseContent },
    { name: 'Participants', component: CourseParticipants },
    { name: 'Assignments', component: CourseAssignments },
    { name: 'Announcements', component: CourseAnnouncements },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{course.code}</p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-indigo-100 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) => `
                w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${selected
                  ? 'bg-white text-indigo-700 shadow'
                  : 'text-indigo-600 hover:bg-white/[0.12] hover:text-indigo-700'
                }
              `}
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {tabs.map((tab) => (
            <Tab.Panel
              key={tab.name}
              className="rounded-xl bg-white p-6 shadow"
            >
              <tab.component courseCode={course.code} />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default CourseDetails;
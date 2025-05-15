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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-theme-text">{course.name}</h1>
        <p className="mt-1 text-sm text-theme-text/70">{course.code}</p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-theme-secondary/20 p-1">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) => `
                w-full rounded-lg py-2.5 text-sm font-medium leading-5 theme-transition
                focus:outline-none focus:ring-2 ring-offset-2 ring-offset-theme-accent/50 ring-white ring-opacity-60
                ${selected
                  ? 'bg-theme-primary text-white shadow'
                  : 'text-theme-text hover:bg-theme-primary/10 hover:text-theme-primary'
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
              className="rounded-xl bg-theme-background p-6 shadow border border-theme-primary/20"
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
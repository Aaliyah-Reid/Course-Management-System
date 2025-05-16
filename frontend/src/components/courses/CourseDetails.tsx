import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { Course } from '../../types/course';
import { UserType } from '../../types/user';
import CourseContent from './tabs/CourseContent';
import CourseParticipants from './tabs/CourseParticipants';
// import CourseForums from './tabs/CourseForums'; // Removed as it doesn't exist
import CourseAssignmentsTab from './tabs/CourseAssignmentsTab';
// TODO: If CourseAnnouncements is to be used, ensure it's correctly imported and used.
// import CourseAnnouncements from './tabs/CourseAnnouncements'; 

interface CourseDetailsProps {
  course: Course;
  userId: string | null;
  userType: UserType | null;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course, userId, userType }) => {
  const [activeTab, setActiveTab] = useState('Content');

  if (!course) {
    return <div className="text-center py-10 text-theme-text">Loading course details...</div>;
  }

  const tabs = [
    { name: 'Content', component: <CourseContent courseCode={course.coursecode} /> },
    { name: 'Participants', component: <CourseParticipants courseCode={course.coursecode} /> },
    // { name: 'Forums', component: <CourseForums courseCode={course.coursecode} userId={userId} userType={userType} /> }, // Temporarily removed
    { 
      name: 'Assignments', 
      component: <CourseAssignmentsTab courseCode={course.coursecode} userId={userId} userType={userType} /> 
    },
    // Example for re-adding announcements if needed:
    // { name: 'Announcements', component: <CourseAnnouncements courseCode={course.coursecode} /> }, 
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition min-h-screen">
      <div className="bg-theme-primary shadow rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-white">{course.coursename}</h1>
        <p className="text-lg text-white/80 mt-1">{course.coursecode}</p>
      </div>

      <div>
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">Select a tab</label>
          <select
            id="tabs"
            name="tabs"
            className="block w-full focus:ring-theme-accent focus:border-theme-accent border-theme-primary/30 rounded-md bg-theme-secondary text-theme-text py-2 px-3"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="border-b border-theme-primary/20">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.name
                      ? 'border-theme-accent text-theme-accent'
                      : 'border-transparent text-theme-text/70 hover:text-theme-text hover:border-theme-text/30'
                    }
                    theme-transition
                  `}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {tabs.find(tab => tab.name === activeTab)?.component}
      </div>
    </div>
  );
};

export default CourseDetails;
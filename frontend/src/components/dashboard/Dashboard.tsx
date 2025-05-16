import React from 'react';
import Calendar from './calendar/Calendar';
import { Course } from '../../types/course';
import { UserType } from '../../types/user';

interface DashboardProps {
  onCourseSelect: (course: Course) => void;
  userId: string | null;
  userType: UserType | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onCourseSelect, userId, userType }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="space-y-8">
        <Calendar 
          onCourseSelect={onCourseSelect} 
          userId={userId} 
          userType={userType} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
import React from 'react';
import Calendar from './calendar/Calendar';
import { Course } from '../../types/course';

interface DashboardProps {
  onCourseSelect: (course: Course) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onCourseSelect }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <Calendar />
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState<string | 'all'>('all');

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Academic Calendar</h2>
          <div className="flex items-center space-x-4">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="rounded-md border-gray-300 py-1.5 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-600 sm:text-sm"
            >
              <option value="all">All Courses</option>
              <option value="cs101">CS101</option>
              <option value="math201">MATH201</option>
            </select>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1.5 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium">
                {format(currentDate, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-1.5 hover:bg-gray-100 rounded-full"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-900"
            >
              {day}
            </div>
          ))}
          {days.map((day, dayIdx) => (
            <div
              key={day.toString()}
              className={`bg-white px-3 py-2 text-sm ${
                dayIdx === 0 ? `col-start-${day.getDay() + 1}` : ''
              }`}
            >
              <time dateTime={format(day, 'yyyy-MM-dd')}>
                {format(day, 'd')}
              </time>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
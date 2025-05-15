import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CalendarEvent, CalendarFilter } from '../../types/calendar';

interface CalendarPageProps {
  onEventClick: (courseCode: string) => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onEventClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<CalendarFilter>({
    courseCode: 'all',
    type: 'all',
    timeframe: 'month'
  });

  // Generate events relative to the current month
  const generateEvents = (baseDate: Date): CalendarEvent[] => {
    const monthStart = startOfMonth(baseDate);
    return [
      {
        id: 1,
        title: 'Programming Assignment Due',
        courseCode: 'CS101',
        date: format(addDays(monthStart, 15), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        type: 'assignment',
        description: 'Complete the programming assignment on data structures',
        duration: 120
      },
      {
        id: 2,
        title: 'Linear Algebra Quiz',
        courseCode: 'MATH201',
        date: format(addDays(monthStart, 20), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        type: 'quiz',
        description: 'Online quiz covering matrices and determinants',
        location: 'Room 301',
        duration: 60
      },
      {
        id: 3,
        title: 'Data Structures Midterm',
        courseCode: 'CS202',
        date: format(addDays(monthStart, 25), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        type: 'exam',
        description: 'Midterm exam covering all topics from weeks 1-6',
        location: 'Main Hall',
        duration: 180
      }
    ];
  };

  const events = generateEvents(currentDate);

  const filteredEvents = events.filter(event => {
    if (filter.courseCode !== 'all' && event.courseCode !== filter.courseCode) return false;
    if (filter.type !== 'all' && event.type !== filter.type) return false;
    return true;
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-theme-secondary/20 text-white border-white/30 hover:bg-theme-secondary/30';
      case 'quiz':
        return 'bg-theme-secondary/20 text-white border-white/30 hover:bg-theme-secondary/30';
      case 'exam':
        return 'bg-theme-secondary/20 text-white border-white/30 hover:bg-theme-secondary/30';
      default:
        return 'bg-theme-secondary/20 text-white border-white/30 hover:bg-theme-secondary/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-theme-primary rounded-lg shadow theme-transition">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold text-white">Academic Calendar</h2>
            <div className="flex items-center space-x-4">
              <select
                value={filter.courseCode}
                onChange={(e) => setFilter({ ...filter, courseCode: e.target.value })}
                className="rounded-md border-white/30 bg-theme-primary text-white py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
              >
                <option value="all">All Courses</option>
                <option value="CS101">CS101</option>
                <option value="MATH201">MATH201</option>
                <option value="CS202">CS202</option>
              </select>

              <select
                value={filter.type}
                onChange={(e) => setFilter({ ...filter, type: e.target.value as CalendarFilter['type'] })}
                className="rounded-md border-white/30 bg-theme-primary text-white py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
              >
                <option value="all">All Types</option>
                <option value="assignment">Assignments</option>
                <option value="quiz">Quizzes</option>
                <option value="exam">Exams</option>
              </select>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="text-sm font-medium text-white">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-px border-white/30 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="bg-theme-primary py-2 text-center text-sm font-semibold text-white border-b border-white/30"
              >
                {day}
              </div>
            ))}
            {days.map((day, dayIdx) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div
                  key={day.toString()}
                  className={`bg-theme-primary px-3 py-2 min-h-[120px] border border-white/30 ${
                    dayIdx === 0 ? `col-start-${day.getDay() + 1}` : ''
                  } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                >
                  <time 
                    dateTime={format(day, 'yyyy-MM-dd')} 
                    className={`block font-medium mb-1 ${
                      isCurrentMonth ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {format(day, 'd')}
                  </time>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick(event.courseCode)}
                        className={`w-full px-2 py-1 text-xs rounded-md border cursor-pointer transition-colors ${getEventColor(event.type)}`}
                        title={`${event.title} - ${format(new Date(event.date), 'h:mm a')}`}
                      >
                        <div className="font-medium truncate text-left">{event.title}</div>
                        <div className="text-xs opacity-75 text-left">{format(new Date(event.date), 'h:mm a')}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
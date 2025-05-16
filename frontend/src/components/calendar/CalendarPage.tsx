import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addDays } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Course } from '../../types/course'; // Adjusted path
import { UserType } from '../../types/user'; // Adjusted path

// Define CalendarEvent type based on what backend provides and frontend needs
interface CalendarEvent {
  id: string | number; // From eventid
  title: string;       // From eventname
  courseCode: string;  // From coursecode
  date: string;        // From eventdate (ISO string)
  type: string;        // We might need to infer this or add to backend if needed for color coding
}

// Props for this calendar component, identical to the dashboard calendar's props
interface CalendarPageProps {
  onCourseSelect: (course: Course) => void; // Renamed from onEventClick, type changed
  userId: string | null;
  userType: UserType | null;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onCourseSelect, userId, userType }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | 'all'>('all');
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's courses for the dropdown
  useEffect(() => {
    if (!userId || !userType || userType === 'admin') {
      setUserCourses([]); 
      return;
    }

    const fetchUserCourses = async () => {
      setIsLoadingCourses(true);
      setError(null);
      try {
        const url = userType === 'student' 
          ? `http://134.199.222.77:5000/courses/student/${userId}` 
          : `http://134.199.222.77:5000/courses/lecturer/${userId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch user courses: ${response.statusText}`);
        const data = await response.json();
        const coursesData = data.studentCourses || data.lecturerCourses || [];
        const mappedCourses: Course[] = coursesData.map((c: any) => ({
          coursecode: c.coursecode,
          coursename: c.coursename,
        }));
        setUserCourses(mappedCourses);
      } catch (err: any) {
        setError(err.message || 'Could not load courses for filter');
        setUserCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchUserCourses();
  }, [userId, userType]);

  // Fetch calendar events based on user, user's courses, and selected course filter
  useEffect(() => {
    const fetchAllEventsForCourse = async (courseCode: string): Promise<CalendarEvent[]> => {
      if (selectedCourseFilter === courseCode) setError(null);

      const response = await fetch(`http://134.199.222.77:5000/calendar_events/course/${courseCode}`);
      if (!response.ok) {
        const errorMsg = `Failed to fetch events for course ${courseCode}: ${response.statusText}`;
        if (selectedCourseFilter === courseCode) setError(errorMsg);
        return []; 
      }
      const data = await response.json();
      const mappedEvents = (data.events || []).map((rawEventItem: any) => ({
        id: rawEventItem.eventid,
        title: rawEventItem.eventname,
        courseCode: courseCode, 
        date: rawEventItem.eventdate, 
        type: 'event', 
      }));
      return mappedEvents;
    };

    const fetchEvents = async () => {
      if (userType !== 'admin' && userCourses.length === 0 && selectedCourseFilter === 'all') {
        setEvents([]);
        setIsLoadingEvents(false); 
        return;
      }
      
      setIsLoadingEvents(true);
      let fetchedEvents: CalendarEvent[] = [];
      try {
        if (selectedCourseFilter === 'all') {
          if (userType === 'admin') {
            setEvents([]); 
          } else { 
            if (userCourses.length > 0) {
              const allEventsPromises = userCourses.map(course => fetchAllEventsForCourse(course.coursecode));
              const eventsByCourse = await Promise.all(allEventsPromises);
              fetchedEvents = eventsByCourse.flat();
              if (fetchedEvents.length === 0) setError("No events found for any of your courses."); else setError(null);
            } else {
              fetchedEvents = [];
              setError("You are not enrolled in any courses.");
            }
          }
        } else { 
          fetchedEvents = await fetchAllEventsForCourse(selectedCourseFilter);
          if (fetchedEvents.length === 0) {
            const courseExists = userCourses.some(c => c.coursecode === selectedCourseFilter);
            if(courseExists) {
                setError(`No events found for course ${selectedCourseFilter} for the current view.`);
            } else {
                setError(`Course ${selectedCourseFilter} not found in your enrolled courses.`);
            }
          } else {
            setError(null); 
          }
        }
        setEvents(fetchedEvents);

      } catch (err: any) {
        setError(err.message || 'Could not load calendar events');
        setEvents([]); 
      } finally {
        setIsLoadingEvents(false);
      }
    };

    if (selectedCourseFilter !== 'all' || (userType === 'admin' && selectedCourseFilter === 'all') || (userType !== 'admin' && selectedCourseFilter === 'all' && userCourses.length > 0) ) {
         fetchEvents();
    } else if (userType !== 'admin' && userCourses.length === 0 && selectedCourseFilter === 'all') {
        setEvents([]);
        setIsLoadingEvents(false); 
    }
  }, [selectedCourseFilter, userCourses, userType]); 

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
    const dayEvents = events.filter(event => {
      const eventDateObj = new Date(event.date); 
      const eventDateFormatted = format(eventDateObj, 'yyyy-MM-dd');
      const targetDateFormatted = format(date, 'yyyy-MM-dd'); 
      const isDateMatch = eventDateFormatted === targetDateFormatted;
      const isCourseMatch = selectedCourseFilter === 'all' || event.courseCode === selectedCourseFilter;
      return isDateMatch && isCourseMatch;
    });
    return dayEvents;
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-theme-accent/80 text-white border-theme-accent hover:bg-theme-accent';
      case 'quiz':
        return 'bg-theme-accent/70 text-white border-theme-accent hover:bg-theme-accent';
      case 'exam':
        return 'bg-theme-accent text-white border-theme-accent/70 hover:bg-theme-accent/90';
      default:
        return 'bg-theme-accent/60 text-white border-theme-accent hover:bg-theme-accent/80';
    }
  };

  const handleEventClick = (eventCourseCode: string) => {
    const targetCourse = userCourses.find(course => course.coursecode === eventCourseCode); 

    if (targetCourse) {
      onCourseSelect(targetCourse);
    } else {
      const courseForNavigation: Course = {
        coursecode: eventCourseCode,
        coursename: `Course ${eventCourseCode}`, 
      };
      onCourseSelect(courseForNavigation); 
    }
  };

  return (
    // The outer div from the original CalendarPage.tsx is kept for page-level styling if any.
    // If this should also be identical to dashboard's Calendar, this div might need adjustment.
    // For now, assuming the main content block is what needs to be replicated.
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-theme-primary rounded-lg shadow theme-transition">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Academic Calendar</h2>
            <div className="flex items-center space-x-4">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="rounded-md border-white/30 bg-theme-primary text-white py-1.5 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
                disabled={isLoadingCourses || (userType !== 'admin' && userCourses.length === 0)}
              >
                <option value="all">All Courses</option>
                {userCourses.map(course => (
                  <option key={course.coursecode} value={course.coursecode}>{course.coursename} ({course.coursecode})</option> 
                ))}
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
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-700 text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

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
                  className={`bg-theme-primary px-3 py-2 min-h-[120px] border border-white/30 relative ${
                    dayIdx === 0 ? `col-start-${day.getDay() + 1}` : ''
                  } ${!isCurrentMonth ? 'opacity-60' : ''}`}
                >
                  <time 
                    dateTime={format(day, 'yyyy-MM-dd')} 
                    className={`block font-medium mb-1 text-xs absolute top-1 right-2 ${
                      isCurrentMonth ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {format(day, 'd')}
                  </time>
                  <div className="space-y-1">
                    {isLoadingEvents ? (
                      <div className="text-center text-white/70 text-xs py-2">Loading events...</div>
                    ) : dayEvents.length === 0 ? (
                      <div className="text-center text-white/50 text-xs py-2 italic">No events</div>
                    ) : (
                      dayEvents.map((event) => {
                        return (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event.courseCode)}
                            className={`w-full px-2 py-1 text-xs rounded-md border cursor-pointer transition-colors ${getEventColor(event.type)} shadow-sm`}
                            title={`${event.title} - ${format(new Date(event.date), 'h:mm a')}`}
                          >
                            <div className="font-semibold truncate text-left">{event.title}</div>
                            <div className="text-xs opacity-75 text-left">{format(new Date(event.date), 'h:mm a')}</div>
                          </button>
                        );
                      })
                    )}
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
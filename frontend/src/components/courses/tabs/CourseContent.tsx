import React, { useEffect, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { Disclosure } from '@headlessui/react';
import { Section, SectionItem } from '../../../types/course';
import { format } from 'date-fns';

// Re-define or import CalendarEvent type if not already globally available or in a shared types file
interface CourseCalendarEvent {
  id: string | number;
  title: string;
  date: string; // Assuming ISO string or similar from backend
  // Add other event properties if needed, e.g., description, type for color-coding
}

interface CourseContentProps {
  courseCode: string;
}

// Helper function to group items by section
const groupContentBySection = (content: any[], currentCourseCode: string): Section[] => {
  if (!content || content.length === 0) return [];

  const sectionsMap: { [key: string]: Section } = {};

  content.forEach(item => {
    if (!sectionsMap[item.sectionid]) {
      sectionsMap[item.sectionid] = {
        id: item.sectionid.toString(),
        title: item.sectiontitle,
        items: [] as SectionItem[],
        courseCode: currentCourseCode,
      } as Section;
    }
    if (item.sectionitemid) {
        sectionsMap[item.sectionid].items.push({
            id: item.sectionitemid.toString(),
            title: item.itemtitle,
            link: item.link,
            filename: item.filename,
            description: item.description,
            type: item.filename ? 'file' : item.link ? 'link' : 'text',
            sectionId: item.sectionid.toString(),
        } as SectionItem);
    }
  });
  return Object.values(sectionsMap);
};

const CourseContent: React.FC<CourseContentProps> = ({ courseCode }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // State for course calendar events
  const [courseEvents, setCourseEvents] = useState<CourseCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseCode) return;

    // Fetch course sections
    const fetchContent = async () => {
      try {
        setIsLoadingSections(true);
        const response = await fetch(`http://localhost:5000/course_content/${courseCode}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for course content`);
        }
        const data = await response.json();
        setSections(groupContentBySection(data.content || [], courseCode));
        setSectionsError(null);
      } catch (e: any) {
        setSectionsError(e.message || 'Failed to fetch course content');
        setSections([]);
      } finally {
        setIsLoadingSections(false);
      }
    };

    // Fetch course calendar events
    const fetchEvents = async () => {
      try {
        setIsLoadingEvents(true);
        const response = await fetch(`http://localhost:5000/calendar_events/course/${courseCode}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for course events`);
        }
        const data = await response.json();
        const mappedEvents: CourseCalendarEvent[] = (data.events || []).map((event: any) => ({
          id: event.eventid,
          title: event.eventname,
          date: event.eventdate,
        }));
        setCourseEvents(mappedEvents);
        setEventsError(null);
      } catch (e: any) {
        setEventsError(e.message || 'Failed to fetch course events');
        setCourseEvents([]);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchContent();
    fetchEvents();
  }, [courseCode]);

  // Combined loading state consideration for the main "Loading content..." message
  if (isLoadingSections) { // Keep initial loading for sections as primary for the page
    return <div className="text-center py-4 text-theme-text">Loading content...</div>;
  }

  // Display sections error if it occurs
  if (sectionsError) {
    return <div className="text-center py-4 text-red-500">Error loading course sections: {sectionsError}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Course Sections Display */}
      {sections.length === 0 && !isLoadingSections && !sectionsError && (
        <div className="text-center py-4 text-theme-text">No learning content available for this course.</div>
      )}
      {sections.length > 0 && sections.map((section) => (
        <Disclosure key={section.id} as="div" className="bg-theme-secondary/5 p-1 rounded-lg">
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between rounded-lg bg-theme-accent/10 px-4 py-3 text-left text-sm font-medium text-theme-text hover:bg-theme-accent/20 theme-transition focus:outline-none focus:ring-2 focus:ring-theme-accent">
                <span>{section.title}</span>
                {open ? (
                  <ChevronUpIcon className="h-5 w-5 text-theme-accent" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-theme-accent" />
                )}
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-theme-text/70">
                {section.items.length === 0 ? (
                    <p className="italic text-theme-text/50">No items in this section.</p>
                ) : (
                    <ul className="space-y-3">
                    {section.items.map((item: SectionItem) => (
                        <li
                        key={item.id}
                        className="flex items-center justify-between rounded-md border border-theme-primary/20 px-4 py-3 hover:bg-theme-primary/5 theme-transition"
                        >
                        <div className="flex-1">
                            <span className="font-medium text-theme-text">{item.title}</span>
                            {item.description && <p className="text-xs text-theme-text/60 mt-1">{item.description}</p>}
                        </div>
                        {
                            item.link && 
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="ml-4 text-sm text-theme-accent hover:underline">View Link</a>
                        }
                        {
                            item.filename && 
                            <span className="ml-4 text-sm text-theme-accent">{item.filename} ({item.type})</span>
                        }
                        {!item.link && !item.filename && <span className="ml-4 text-xs text-theme-text/50">{item.type}</span>}
                        </li>
                    ))}
                    </ul>
                )}
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ))}

      {/* Course Calendar Events Display */}
      <div className="mt-8 pt-6 border-t border-theme-primary/20">
        <h3 className="text-lg font-semibold text-theme-text mb-4 flex items-center">
          <CalendarDaysIcon className="h-6 w-6 mr-2 text-theme-accent" />
          Course Events
        </h3>
        {isLoadingEvents && <div className="text-center py-4 text-theme-text">Loading events...</div>}
        {eventsError && <div className="text-center py-4 text-red-500">Error loading events: {eventsError}</div>}
        {!isLoadingEvents && !eventsError && courseEvents.length === 0 && (
          <p className="text-theme-text/70 italic">No upcoming events scheduled for this course.</p>
        )}
        {!isLoadingEvents && !eventsError && courseEvents.length > 0 && (
          <ul className="space-y-3">
            {courseEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(event => {
              return (
                <li key={event.id} className="p-4 rounded-md bg-theme-secondary/10 border border-theme-primary/20 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-theme-text">{event.title}</p>
                    <p className="text-sm text-theme-text/70">
                      {format(new Date(event.date), 'EEE, MMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                  {/* Optionally add a button/link here if events should be clickable to a specific view */}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CourseContent;
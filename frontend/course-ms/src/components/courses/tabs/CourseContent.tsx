import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Disclosure } from '@headlessui/react';

interface CourseContentProps {
  courseCode: string;
}

const CourseContent: React.FC<CourseContentProps> = ({ courseCode }) => {
  // Mock data - replace with actual data from your backend
  const sections = [
    {
      id: '1',
      title: 'Introduction',
      items: [
        { id: '1', title: 'Course Overview', type: 'document' },
        { id: '2', title: 'Course Schedule', type: 'document' },
      ],
    },
    {
      id: '2',
      title: 'Week 1: Getting Started',
      items: [
        { id: '3', title: 'Lecture Slides', type: 'presentation' },
        { id: '4', title: 'Required Reading', type: 'pdf' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <Disclosure key={section.id}>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between rounded-lg bg-indigo-50 px-4 py-3 text-left text-sm font-medium text-indigo-900 hover:bg-indigo-100">
                <span>{section.title}</span>
                {open ? (
                  <ChevronUpIcon className="h-5 w-5 text-indigo-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-indigo-500" />
                )}
              </Disclosure.Button>
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                    >
                      <span>{item.title}</span>
                      <span className="text-xs text-gray-400">{item.type}</span>
                    </li>
                  ))}
                </ul>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      ))}
    </div>
  );
};

export default CourseContent;
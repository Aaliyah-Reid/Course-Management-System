import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bell, GraduationCap } from 'lucide-react';
import {
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  onNavigate: (page: 'dashboard' | 'courses') => void;
  currentPage: 'dashboard' | 'courses';
}

const userNavigation = [
  { name: 'Profile', href: '#', icon: UserIcon },
  { name: 'Grades', href: '#', icon: AcademicCapIcon },
  { name: 'Calendar', href: '#', icon: CalendarIcon },
  { name: 'Reports', href: '#', icon: ChartBarIcon },
  { name: 'Preferences', href: '#', icon: Cog6ToothIcon },
  { name: 'Log Out', href: '#', icon: ArrowRightOnRectangleIcon },
];

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage }) => {
  const unreadNotifications = 3;
  const userInitials = 'JD';

  const navigation = [
    { name: 'Dashboard', onClick: () => onNavigate('dashboard'), current: currentPage === 'dashboard' },
    { name: 'Courses', onClick: () => onNavigate('courses'), current: currentPage === 'courses' },
    { name: 'Forums', href: '#', current: false },
  ];

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center"
            >
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">LMS</span>
            </button>
            <div className="hidden md:ml-10 md:block">
              <div className="flex space-x-8">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className={`${
                      item.current
                        ? 'text-indigo-600'
                        : 'text-gray-500 hover:text-gray-900'
                    } px-3 py-2 text-sm font-medium transition-colors duration-200`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              type="button"
              className="relative rounded-full p-1 text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <span className="absolute -inset-1.5" />
              <Bell className="h-6 w-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">{unreadNotifications}</span>
                </span>
              )}
            </button>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          className={`
                            ${active ? 'bg-gray-50' : ''}
                            flex items-center px-4 py-2 text-sm text-gray-700 group
                          `}
                        >
                          <item.icon
                            className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                            aria-hidden="true"
                          />
                          {item.name}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
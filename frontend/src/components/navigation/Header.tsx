import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { GraduationCap, Sun, Moon } from 'lucide-react';
import {
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useThemeStore } from '../../utils/theme';

interface HeaderProps {
  onNavigate: (page: 'dashboard' | 'courses' | 'forums' | 'assignments' | 'profile' | 'grades' | 'calendar' | 'reports' | 'preferences') => void;
  currentPage: 'dashboard' | 'courses' | 'forums' | 'assignments' | 'profile' | 'grades' | 'calendar' | 'reports' | 'preferences';
  onLogout: () => void;
  firstName?: string | null;
  lastName?: string | null;
}

const userNavigation = [
  { name: 'Profile', page: 'profile', icon: UserIcon },
  { name: 'Grades', page: 'grades', icon: AcademicCapIcon },
  { name: 'Calendar', page: 'calendar', icon: CalendarIcon },
  { name: 'Reports', page: 'reports', icon: ChartBarIcon },
  { name: 'Preferences', page: 'preferences', icon: Cog6ToothIcon },
  { name: 'Log Out', page: 'logout', icon: ArrowRightOnRectangleIcon },
];

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, onLogout, firstName, lastName }) => {
  const { mode, setMode } = useThemeStore();
  
  let userInitials = 'LMS';
  if (firstName && lastName) {
    userInitials = `${firstName[0]}${lastName[0]}`.toUpperCase();
  } else if (firstName) {
    userInitials = `${firstName.substring(0, 2)}`.toUpperCase();
  }

  const navigation = [
    { name: 'Dashboard', onClick: () => onNavigate('dashboard'), current: currentPage === 'dashboard' },
    { name: 'Courses', onClick: () => onNavigate('courses'), current: currentPage === 'courses' },
    { name: 'Assignments', onClick: () => onNavigate('assignments'), current: currentPage === 'assignments' },
    { name: 'Forums', onClick: () => onNavigate('forums'), current: currentPage === 'forums' },
    { name: 'Grades', onClick: () => onNavigate('grades'), current: currentPage === 'grades' },
  ];

  const handleNavigation = (page: string) => {
    if (page === 'logout') {
      onLogout();
      return;
    }
    if (['dashboard', 'courses', 'forums', 'assignments', 'profile', 'grades', 'calendar', 'reports', 'preferences'].includes(page)) {
      onNavigate(page as 'dashboard' | 'courses' | 'forums' | 'assignments' | 'profile' | 'grades' | 'calendar' | 'reports' | 'preferences');
    }
  };

  return (
    <header className="bg-theme-background shadow-sm fixed w-full top-0 z-50 theme-transition">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center"
            >
              <GraduationCap className="h-8 w-8 text-theme-primary" />
              <span className="ml-2 text-xl font-semibold text-theme-text">LMS</span>
            </button>
            <div className="hidden md:ml-10 md:block">
              <div className="flex space-x-8">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={item.onClick}
                    className={`${
                      item.current
                        ? 'text-theme-secondary'
                        : 'text-theme-text hover:text-theme-primary'
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
              onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
              className="p-2 rounded-full hover:bg-theme-primary/10 theme-transition"
              aria-label="Toggle mode"
            >
              {mode === 'light' ? (
                <Moon className="h-5 w-5 text-theme-text" />
              ) : (
                <Sun className="h-5 w-5 text-theme-text" />
              )}
            </button>

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center">
                <span className="absolute -inset-1.5" />
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-theme-primary flex items-center justify-center text-white text-sm font-medium">
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
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-theme-background py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <button
                          onClick={() => handleNavigation(item.page)}
                          className={`
                            ${active ? 'bg-theme-primary/10' : ''}
                            flex items-center w-full px-4 py-2 text-sm text-theme-text group theme-transition
                          `}
                        >
                          <item.icon
                            className="mr-3 h-5 w-5 text-theme-text group-hover:text-theme-primary"
                            aria-hidden="true"
                          />
                          {item.name}
                        </button>
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
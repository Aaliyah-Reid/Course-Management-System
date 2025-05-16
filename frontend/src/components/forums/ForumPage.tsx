import React, { useState, useEffect } from 'react';
import ForumList from './ForumList';
import ThreadList from './ThreadList';
import ThreadView from './ThreadView';
import { Forum, Thread } from '../../types/forum';
import { User } from '../../types/user'; // Assuming User type includes id and userType
import { Course } from '../../types/course.ts'; // Ensure .ts is used if your setup requires it, or remove if not.

interface ForumPageProps {
  currentUser: User | null;
}

type ViewState =
  | { type: 'courseList' }
  | { type: 'forums'; selectedCourse: Course }
  | { type: 'threads'; selectedForum: Forum; selectedCourse: Course }
  | { type: 'thread'; selectedThread: Thread; selectedForum: Forum; selectedCourse: Course };

const ForumPage: React.FC<ForumPageProps> = ({ currentUser }) => {
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'courseList' });
  const [userCourses, setUserCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);
  const [errorCourses, setErrorCourses] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setUserCourses([]);
      setCurrentView({ type: 'courseList' }); // Or handle as appropriate
      return;
    }

    const fetchUserCourses = async () => {
      setIsLoadingCourses(true);
      setErrorCourses(null);
      let coursesUrl = '';
      if (currentUser.userType === 'student') {
        coursesUrl = `http://localhost:5000/courses/student/${currentUser.id}`;
      } else if (currentUser.userType === 'lecturer') {
        coursesUrl = `http://localhost:5000/courses/lecturer/${currentUser.id}`;
      } else {
        // Admins might see all courses or a different view, handle as needed
        // For now, let's assume admins don't use this page this way or show no courses
        setIsLoadingCourses(false);
        setUserCourses([]);
        // Optionally set an error or message for admins
        // setErrorCourses("Forum view by course is not applicable for admins here.");
        return;
      }

      try {
        const response = await fetch(coursesUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch courses: ${response.statusText}`);
        }
        const data = await response.json();
        // API for student: { studentCourses: Course[] }
        // API for lecturer: { lecturerCourses: Course[] }
        // The Course type expects coursecode and coursename (all lowercase)
        const courses: Course[] = data.studentCourses || data.lecturerCourses || [];
        setUserCourses(courses);
      } catch (err) {
        setErrorCourses(err instanceof Error ? err.message : 'An unknown error occurred fetching courses');
        setUserCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchUserCourses();
  }, [currentUser]);

  const handleCourseSelect = (course: Course) => {
    setCurrentView({ type: 'forums', selectedCourse: course });
  };

  const handleForumSelect = (forum: Forum) => {
    if (currentView.type === 'forums') {
      setCurrentView({ type: 'threads', selectedForum: forum, selectedCourse: currentView.selectedCourse });
    }
  };

  const handleThreadSelect = (thread: Thread) => {
    if (currentView.type === 'threads') {
      setCurrentView({ type: 'thread', selectedThread: thread, selectedForum: currentView.selectedForum, selectedCourse: currentView.selectedCourse });
    }
  };

  const handleBack = () => {
    switch (currentView.type) {
      case 'thread':
        setCurrentView({ type: 'threads', selectedForum: currentView.selectedForum, selectedCourse: currentView.selectedCourse });
        break;
      case 'threads':
        setCurrentView({ type: 'forums', selectedCourse: currentView.selectedCourse });
        break;
      case 'forums':
        setCurrentView({ type: 'courseList' });
        break;
      case 'courseList':
      default:
        break;
    }
  };

  let content;
  if (!currentUser) {
    content = <p className="text-theme-text text-center py-4">Please log in to view forums.</p>;
  } else {
    switch (currentView.type) {
      case 'courseList':
        if (isLoadingCourses) {
          content = <p className="text-theme-text text-center py-4">Loading your courses...</p>;
        } else if (errorCourses) {
          content = <p className="text-red-500 text-center py-4">Error: {errorCourses}</p>;
        } else if (userCourses.length === 0) {
          content = <p className="text-theme-text/70 text-center py-4">No courses found for you to display forums.</p>;
        } else {
          content = (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-theme-text mb-4">Your Courses</h2>
              {userCourses.map((course) => (
                <div
                  key={course.coursecode}
                  onClick={() => handleCourseSelect(course)}
                  className="bg-theme-card p-4 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border border-theme-primary/20"
                >
                  <h3 className="text-lg font-medium text-theme-text">{course.coursename}</h3>
                  <p className="text-sm text-theme-text/80">{course.coursecode}</p>
                </div>
              ))}
            </div>
          );
        }
        break;
      case 'forums':
        content = (
          <>
            <button onClick={handleBack} className="mb-4 text-sm text-theme-accent hover:underline">
              &larr; Back to Courses
            </button>
            <h2 className="text-xl font-semibold text-theme-text mb-4">Forums for {currentView.selectedCourse.coursename}</h2>
            <ForumList
              courseCode={currentView.selectedCourse.coursecode}
              onForumSelect={handleForumSelect}
              userId={currentUser.id}
              userType={currentUser.userType}
            />
          </>
        );
        break;
      case 'threads':
        content = (
          <ThreadList
            forum={currentView.selectedForum}
            currentUser={currentUser}
            onThreadSelect={handleThreadSelect}
            onBack={handleBack} // Back from threads goes to forums of the selectedCourse
          />
        );
        break;
      case 'thread':
        content = (
          <ThreadView
            initialThread={currentView.selectedThread}
            currentUser={currentUser}
            onBack={handleBack} // Back from a thread goes to its threadlist
          />
        );
        break;
      default:
        content = <p>Error: Unknown view state.</p>;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6 py-6 bg-theme-background min-h-[calc(100vh-150px)]">
      {/* General page header, could be dynamic */}
      {/* <h1 className="text-2xl font-bold text-theme-text mb-6">Discussion Forums</h1> */}
      {content}
    </div>
  );
};

export default ForumPage;
import React, { useState, useEffect } from 'react';
import { UserType } from '../../types/user';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface PopularCourse {
  coursecode: string;
  coursename: string;
  student_count: number;
}

interface ActiveStudent {
  studentid: number;
  firstname: string;
  lastname: string;
  course_count: number;
}

interface BusyLecturer {
  lecturerid: number;
  firstname: string;
  lastname: string;
  course_count: number;
}

interface TopCourse {
  coursecode: string;
  coursename: string;
  student_count: number;
}

interface TopStudent {
  studentid: number;
  firstname: string;
  lastname: string;
  average_score: number;
}

interface ReportsPageProps {
  userId: string | null;
  userType: UserType | null;
}

const ITEMS_PER_PAGE = 5;

const ReportsPage: React.FC<ReportsPageProps> = ({ userId, userType }) => {
  const [popularCourses, setPopularCourses] = useState<PopularCourse[]>([]);
  const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
  const [busyLecturers, setBusyLecturers] = useState<BusyLecturer[]>([]);
  const [topCourses, setTopCourses] = useState<TopCourse[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  
  // Pagination states
  const [popularCoursesPage, setPopularCoursesPage] = useState(1);
  const [activeStudentsPage, setActiveStudentsPage] = useState(1);
  const [busyLecturersPage, setBusyLecturersPage] = useState(1);
  const [topCoursesPage, setTopCoursesPage] = useState(1);
  const [topStudentsPage, setTopStudentsPage] = useState(1);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userType !== 'admin' && userType !== 'student') return;
    
    const fetchAllReports = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch popular courses (50+ students)
        const popularCoursesResponse = await fetch('http://134.199.222.77:5000/reports/popular_courses');
        if (!popularCoursesResponse.ok) throw new Error(`Failed to fetch popular courses: ${popularCoursesResponse.statusText}`);
        const popularCoursesData = await popularCoursesResponse.json();
        console.log('Popular courses data:', popularCoursesData);
        setPopularCourses(popularCoursesData.popularCourses || []);

        // Fetch active students (5+ courses)
        const activeStudentsResponse = await fetch('http://134.199.222.77:5000/reports/active_students');
        if (!activeStudentsResponse.ok) throw new Error(`Failed to fetch active students: ${activeStudentsResponse.statusText}`);
        const activeStudentsData = await activeStudentsResponse.json();
        console.log('Active students data:', activeStudentsData);
        setActiveStudents(activeStudentsData.activeStudents || []);

        // Fetch busy lecturers (3+ courses)
        const busyLecturersResponse = await fetch('http://134.199.222.77:5000/reports/busy_lecturers');
        if (!busyLecturersResponse.ok) throw new Error(`Failed to fetch busy lecturers: ${busyLecturersResponse.statusText}`);
        const busyLecturersData = await busyLecturersResponse.json();
        console.log('Busy lecturers data:', busyLecturersData);
        setBusyLecturers(busyLecturersData.busyLecturers || []);

        // Fetch top 10 enrolled courses
        const topCoursesResponse = await fetch('http://134.199.222.77:5000/reports/top_courses');
        if (!topCoursesResponse.ok) throw new Error(`Failed to fetch top courses: ${topCoursesResponse.statusText}`);
        const topCoursesData = await topCoursesResponse.json();
        console.log('Top courses data:', topCoursesData);
        setTopCourses(topCoursesData.topEnrolledCourses || []);

        // Fetch top 10 students by average
        const topStudentsResponse = await fetch('http://134.199.222.77:5000/reports/top_students');
        if (!topStudentsResponse.ok) throw new Error(`Failed to fetch top students: ${topStudentsResponse.statusText}`);
        const topStudentsData = await topStudentsResponse.json();
        console.log('Top students data:', topStudentsData);
        setTopStudents(topStudentsData.topStudents || []);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred fetching reports');
        console.error('Error fetching reports:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllReports();
  }, [userType]);

  // Calculate pagination data
  const paginateData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return data.slice(startIndex, endIndex);
  };

  // Pagination controls component
  const PaginationControls = ({ 
    totalItems, 
    currentPage, 
    setPage 
  }: { 
    totalItems: number, 
    currentPage: number, 
    setPage: React.Dispatch<React.SetStateAction<number>> 
  }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-theme-text/70">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
          </span>
        </div>
        <div className="flex items-center">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-1 rounded ${currentPage === 1 ? 'text-theme-text/30 cursor-not-allowed' : 'text-theme-text/70 hover:text-theme-primary hover:bg-theme-primary/10'}`}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-1 rounded ${currentPage === totalPages ? 'text-theme-text/30 cursor-not-allowed' : 'text-theme-text/70 hover:text-theme-primary hover:bg-theme-primary/10'}`}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  // Show message if user is not an admin or student
  if (userType !== 'admin' && userType !== 'student') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-theme-text mb-2">Access Restricted</h2>
          <p className="text-theme-text/70">Administrative reports are only available to admin and student users.</p>
        </div>
      </div>
    );
  }

  // Display loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-theme-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-theme-text/70">Loading reports data...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-red-500">
          <p className="mb-2 font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Get paginated data
  const paginatedPopularCourses = paginateData(popularCourses, popularCoursesPage);
  const paginatedActiveStudents = paginateData(activeStudents, activeStudentsPage);
  const paginatedBusyLecturers = paginateData(busyLecturers, busyLecturersPage);
  const paginatedTopCourses = paginateData(topCourses, topCoursesPage);
  const paginatedTopStudents = paginateData(topStudents, topStudentsPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <h1 className="text-2xl font-bold text-theme-text mb-8 border-b border-theme-primary/20 pb-4">Administrative Reports</h1>
      
      {/* Popular Courses - 50+ students */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <span className="h-6 w-6 rounded-full bg-theme-primary flex items-center justify-center text-white mr-2 text-xs">1</span>
          Courses with 50+ Students
        </h2>
        {popularCourses.length === 0 ? (
          <div className="bg-theme-background rounded-lg p-6 border border-theme-primary/20 text-theme-text/70 text-center">
            No courses with 50 or more students found.
          </div>
        ) : (
          <div className="rounded-lg border border-theme-primary/20 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-primary/20">
                <thead className="bg-theme-primary/10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Course Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Course Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Student Count</th>
                  </tr>
                </thead>
                <tbody className="bg-theme-background divide-y divide-theme-primary/10">
                  {paginatedPopularCourses.map((course) => (
                    <tr key={course.coursecode} className="hover:bg-theme-primary/5 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">{course.coursecode}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{course.coursename}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text bg-theme-primary/5 rounded-md text-center font-semibold">
                        {course.student_count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-theme-primary/20">
              <PaginationControls 
                totalItems={popularCourses.length} 
                currentPage={popularCoursesPage} 
                setPage={setPopularCoursesPage} 
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Active Students - 5+ courses */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <span className="h-6 w-6 rounded-full bg-theme-primary flex items-center justify-center text-white mr-2 text-xs">2</span>
          Students Enrolled in 5+ Courses
        </h2>
        {activeStudents.length === 0 ? (
          <div className="bg-theme-background rounded-lg p-6 border border-theme-primary/20 text-theme-text/70 text-center">
            No students enrolled in 5 or more courses found.
          </div>
        ) : (
          <div className="rounded-lg border border-theme-primary/20 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-primary/20">
                <thead className="bg-theme-primary/10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Student ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Course Count</th>
                  </tr>
                </thead>
                <tbody className="bg-theme-background divide-y divide-theme-primary/10">
                  {paginatedActiveStudents.map((student) => (
                    <tr key={student.studentid} className="hover:bg-theme-primary/5 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">{student.studentid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{`${student.firstname} ${student.lastname}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text bg-theme-primary/5 rounded-md text-center font-semibold">
                        {student.course_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-theme-primary/20">
              <PaginationControls 
                totalItems={activeStudents.length} 
                currentPage={activeStudentsPage} 
                setPage={setActiveStudentsPage} 
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Busy Lecturers - 3+ courses */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <span className="h-6 w-6 rounded-full bg-theme-primary flex items-center justify-center text-white mr-2 text-xs">3</span>
          Lecturers Teaching 3+ Courses
        </h2>
        {busyLecturers.length === 0 ? (
          <div className="bg-theme-background rounded-lg p-6 border border-theme-primary/20 text-theme-text/70 text-center">
            No lecturers teaching 3 or more courses found.
          </div>
        ) : (
          <div className="rounded-lg border border-theme-primary/20 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-primary/20">
                <thead className="bg-theme-primary/10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Lecturer ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Course Count</th>
                  </tr>
                </thead>
                <tbody className="bg-theme-background divide-y divide-theme-primary/10">
                  {paginatedBusyLecturers.map((lecturer) => (
                    <tr key={lecturer.lecturerid} className="hover:bg-theme-primary/5 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">{lecturer.lecturerid}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{`${lecturer.firstname} ${lecturer.lastname}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text bg-theme-primary/5 rounded-md text-center font-semibold">
                        {lecturer.course_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-theme-primary/20">
              <PaginationControls 
                totalItems={busyLecturers.length} 
                currentPage={busyLecturersPage} 
                setPage={setBusyLecturersPage} 
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Top 10 Enrolled Courses */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <span className="h-6 w-6 rounded-full bg-theme-primary flex items-center justify-center text-white mr-2 text-xs">4</span>
          Top 10 Enrolled Courses
        </h2>
        {topCourses.length === 0 ? (
          <div className="bg-theme-background rounded-lg p-6 border border-theme-primary/20 text-theme-text/70 text-center">
            No course enrollment data available.
          </div>
        ) : (
          <div className="rounded-lg border border-theme-primary/20 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-primary/20">
                <thead className="bg-theme-primary/10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Course Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Course Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Student Count</th>
                  </tr>
                </thead>
                <tbody className="bg-theme-background divide-y divide-theme-primary/10">
                  {paginatedTopCourses.map((course, index) => {
                    // Calculate the actual rank based on page
                    const rankIndex = (topCoursesPage - 1) * ITEMS_PER_PAGE + index;
                    return (
                      <tr key={course.coursecode} className={`hover:bg-theme-primary/5 transition-colors duration-150 ${rankIndex < 3 ? 'bg-theme-secondary/5' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-medium ${
                            rankIndex === 0 ? 'bg-yellow-500' : rankIndex === 1 ? 'bg-gray-400' : rankIndex === 2 ? 'bg-amber-600' : 'bg-theme-primary/50'
                          }`}>
                            {rankIndex + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">{course.coursecode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{course.coursename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm bg-theme-primary/5 rounded-md text-center font-semibold text-theme-text">
                          {course.student_count.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-theme-primary/20">
              <PaginationControls 
                totalItems={topCourses.length} 
                currentPage={topCoursesPage} 
                setPage={setTopCoursesPage} 
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Top 10 Students by Average Score */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-theme-text mb-4 flex items-center">
          <span className="h-6 w-6 rounded-full bg-theme-primary flex items-center justify-center text-white mr-2 text-xs">5</span>
          Top 10 Students by Average Score
        </h2>
        {topStudents.length === 0 ? (
          <div className="bg-theme-background rounded-lg p-6 border border-theme-primary/20 text-theme-text/70 text-center">
            No student grade data available.
          </div>
        ) : (
          <div className="rounded-lg border border-theme-primary/20 shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-primary/20">
                <thead className="bg-theme-primary/10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Rank</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Student ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">Average Score</th>
                  </tr>
                </thead>
                <tbody className="bg-theme-background divide-y divide-theme-primary/10">
                  {paginatedTopStudents.map((student, index) => {
                    // Calculate the actual rank based on page
                    const rankIndex = (topStudentsPage - 1) * ITEMS_PER_PAGE + index;
                    return (
                      <tr key={student.studentid} className={`hover:bg-theme-primary/5 transition-colors duration-150 ${rankIndex < 3 ? 'bg-theme-secondary/5' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-white text-xs font-medium ${
                            rankIndex === 0 ? 'bg-yellow-500' : rankIndex === 1 ? 'bg-gray-400' : rankIndex === 2 ? 'bg-amber-600' : 'bg-theme-primary/50'
                          }`}>
                            {rankIndex + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-primary">{student.studentid}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text">{`${student.firstname} ${student.lastname}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-block px-3 py-1 bg-theme-secondary/10 text-theme-secondary rounded-md text-sm font-bold">
                            {typeof student.average_score === 'number' 
                              ? `${student.average_score.toFixed(2)}%` 
                              : student.average_score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-theme-primary/20">
              <PaginationControls 
                totalItems={topStudents.length} 
                currentPage={topStudentsPage} 
                setPage={setTopStudentsPage} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
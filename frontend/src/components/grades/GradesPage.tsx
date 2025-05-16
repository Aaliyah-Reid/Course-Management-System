import React, { useState, useEffect } from 'react';
import { User, UserType } from '../../types/user';
import { StudentGrade, LecturerGradeEntry, StudentGradesResponse, LecturerGradesResponse } from '../../types/grade';
import { BookOpenIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface GradesPageProps {
  currentUser: User | null;
}

const GradesPage: React.FC<GradesPageProps> = ({ currentUser }) => {
  const [grades, setGrades] = useState<StudentGrade[] | LecturerGradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setGrades([]);
      return;
    }

    const fetchGrades = async () => {
      setIsLoading(true);
      setError(null);
      let url = '';

      if (currentUser.userType === 'student') {
        url = `http://localhost:5000/student/${currentUser.id}/grades`;
      } else if (currentUser.userType === 'lecturer') {
        url = `http://localhost:5000/lecturer/${currentUser.id}/course_grades`;
      } else {
        setError('Grade view is only available for students and lecturers.');
        setIsLoading(false);
        setGrades([]);
        return;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Catch if error response is not JSON
          throw new Error(`Failed to fetch grades: ${response.statusText} - ${errorData.error || 'Server error'}`);
        }
        const data = await response.json();
        if (currentUser.userType === 'student') {
          setGrades((data as StudentGradesResponse).studentGrades || []);
        } else if (currentUser.userType === 'lecturer') {
          setGrades((data as LecturerGradesResponse).lecturerCourseGrades || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setGrades([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [currentUser]);

  const groupGradesByCourse = (gradeList: (StudentGrade | LecturerGradeEntry)[]) => {
    return gradeList.reduce((acc, grade) => {
      const courseKey = grade.coursecode;
      if (!acc[courseKey]) {
        acc[courseKey] = {
          courseName: grade.coursename,
          grades: [],
        };
      }
      acc[courseKey].grades.push(grade);
      return acc;
    }, {} as Record<string, { courseName: string; grades: (StudentGrade | LecturerGradeEntry)[] }>);
  };

  const groupedGrades = groupGradesByCourse(grades);

  const renderGradeItem = (grade: StudentGrade | LecturerGradeEntry, index: number) => {
    const isLecturerView = 'studentid' in grade; // Check if it's a LecturerGradeEntry
    const hasScore = grade.score !== null && grade.score !== undefined;
    const isPassing = hasScore && grade.score >= 50;

    return (
      <div key={grade.submissionid || `assignment-${grade.assignmentid}-${index}`} className="p-4 bg-theme-background rounded-md shadow-sm border border-theme-primary/10">
        <h4 className="text-md font-semibold text-theme-text">{grade.assignmentcontent || 'Unnamed Assignment'}</h4>
        <p className="text-xs text-theme-text/70 mb-1">Assignment ID: {grade.assignmentid}</p>
        {isLecturerView && (
          <p className="text-sm text-theme-text/90">
            Student: {(grade as LecturerGradeEntry).studentfirstname} {(grade as LecturerGradeEntry).studentlastname} (ID: {(grade as LecturerGradeEntry).studentid})
          </p>
        )}
        {hasScore && (
          <p className={`text-lg font-bold ${isPassing ? 'text-theme-accent' : 'text-theme-secondary'}`}>
            Score: {grade.score!.toFixed(2)}%
          </p>
        )}
        {!hasScore && (
          <p className="text-lg font-bold text-theme-text/50">Not Graded</p>
        )}
        <p className="text-sm text-theme-text/80">Due: {grade.assignmentduedate ? new Date(grade.assignmentduedate).toLocaleDateString() : 'N/A'}</p>
        {grade.submissioncontent && <p className="text-xs text-theme-text/70 mt-1">Submitted: {grade.submissiondate ? new Date(grade.submissiondate).toLocaleString() : 'N/A'}</p>}
        {!grade.submissioncontent && currentUser?.userType === 'student' && (
            <p className="text-xs text-theme-primary mt-1">Not Submitted</p>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return <p className="text-theme-text text-center py-6">Please log in to view grades.</p>;
  }

  if (isLoading) {
    return <p className="text-theme-text text-center py-6">Loading grades...</p>;
  }

  if (error) {
    return <p className="text-theme-secondary text-center py-6">Error: {error}</p>;
  }

  if (grades.length === 0 && (currentUser.userType === 'student' || currentUser.userType === 'lecturer')) {
    return <p className="text-theme-text/70 text-center py-6">No grades available at this time.</p>;
  }
  
  if (currentUser.userType !== 'student' && currentUser.userType !== 'lecturer') {
    return <p className="text-theme-text/70 text-center py-6">Grade view is not available for your user type.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 py-8 bg-theme-background">
      <div className="flex items-center mb-6">
        {currentUser.userType === 'student' ? 
            <AcademicCapIcon className="h-8 w-8 text-theme-primary mr-3" /> : 
            <BookOpenIcon className="h-8 w-8 text-theme-primary mr-3" />}
        <h1 className="text-3xl font-bold text-theme-text">
          {currentUser.userType === 'student' ? 'Your Grades' : 'Course Grades Overview'}
        </h1>
      </div>

      {Object.entries(groupedGrades).length === 0 && !isLoading && (
         <p className="text-theme-text/70 text-center py-6">No grades found.</p>
      )}

      {Object.entries(groupedGrades).map(([courseCode, courseData]) => (
        <div key={courseCode} className="mb-8 p-5 bg-theme-background rounded-xl shadow-lg border border-theme-primary/10 theme-transition">
          <h2 className="text-2xl font-semibold text-theme-accent mb-4 pb-2 border-b border-theme-primary/20">
            {courseData.courseName} ({courseCode})
          </h2>
          {courseData.grades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courseData.grades.map(renderGradeItem)}
            </div>
          ) : (
            <p className="text-theme-text/70">No grades or assignments found for this course.</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default GradesPage;
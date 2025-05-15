import React, { useState } from 'react';
import { format } from 'date-fns';
import { CourseGrade, Grade } from '../../types/grades';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// Mock data - replace with actual data from your backend
const mockGrades: CourseGrade[] = [
  {
    courseId: '1',
    courseName: 'Introduction to Computer Science',
    courseCode: 'CS101',
    overallGrade: 92.5,
    grades: [
      {
        id: '1',
        courseId: '1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        assignmentId: '1',
        assignmentName: 'Programming Assignment 1',
        type: 'assignment',
        score: 95,
        maxScore: 100,
        weight: 15,
        submittedDate: '2024-02-15T14:30:00Z',
        feedback: 'Excellent work! Clear and efficient implementation.'
      },
      {
        id: '2',
        courseId: '1',
        courseName: 'Introduction to Computer Science',
        courseCode: 'CS101',
        assignmentId: '2',
        assignmentName: 'Midterm Exam',
        type: 'exam',
        score: 88,
        maxScore: 100,
        weight: 30,
        submittedDate: '2024-03-01T10:00:00Z',
        feedback: 'Good understanding of core concepts. Review section 3.4.'
      }
    ]
  },
  {
    courseId: '2',
    courseName: 'Linear Algebra',
    courseCode: 'MATH201',
    overallGrade: 87.8,
    grades: [
      {
        id: '3',
        courseId: '2',
        courseName: 'Linear Algebra',
        courseCode: 'MATH201',
        assignmentId: '3',
        assignmentName: 'Matrix Operations Quiz',
        type: 'quiz',
        score: 85,
        maxScore: 100,
        weight: 10,
        submittedDate: '2024-02-20T09:15:00Z'
      },
      {
        id: '4',
        courseId: '2',
        courseName: 'Linear Algebra',
        courseCode: 'MATH201',
        assignmentId: '4',
        assignmentName: 'Eigenvalues Project',
        type: 'project',
        score: 92,
        maxScore: 100,
        weight: 25,
        submittedDate: '2024-03-10T16:45:00Z',
        feedback: 'Outstanding analysis and presentation.'
      }
    ]
  }
];

const GradesPage: React.FC = () => {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const getGradeColor = (score: number): string => {
    if (score >= 90) return 'text-theme-primary';
    if (score >= 80) return 'text-theme-secondary';
    if (score >= 70) return 'text-theme-accent';
    return 'text-red-500';
  };

  const getGradeLetterAndColor = (score: number): { letter: string; color: string } => {
    if (score >= 90) return { letter: 'A', color: 'text-theme-primary' };
    if (score >= 80) return { letter: 'B', color: 'text-theme-secondary' };
    if (score >= 70) return { letter: 'C', color: 'text-theme-accent' };
    if (score >= 60) return { letter: 'D', color: 'text-orange-500' };
    return { letter: 'F', color: 'text-red-500' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-theme-text">Academic Performance</h1>
        <p className="mt-1 text-sm text-theme-text/70">View your grades and academic progress</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {mockGrades.map((course) => {
          const isExpanded = expandedCourses.has(course.courseId);
          const { letter: gradeLetter, color: gradeColor } = getGradeLetterAndColor(course.overallGrade);

          return (
            <div key={course.courseId} className="bg-theme-background rounded-lg shadow overflow-hidden border border-theme-primary/20">
              <button
                onClick={() => toggleCourse(course.courseId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-theme-primary/5 transition-colors"
              >
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-theme-text">{course.courseName}</h2>
                  <p className="text-sm text-theme-text/70">{course.courseCode}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${gradeColor}`}>{gradeLetter}</p>
                    <p className="text-sm text-theme-text/70">{course.overallGrade.toFixed(1)}%</p>
                  </div>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-theme-text/50" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-theme-text/50" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-theme-primary/20">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-theme-primary/20">
                      <thead className="bg-theme-primary/5">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                            Assignment
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                            Type
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                            Weight
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                            Score
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                            Submitted
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-theme-background divide-y divide-theme-primary/20">
                        {course.grades.map((grade) => (
                          <tr
                            key={grade.id}
                            onClick={() => setSelectedGrade(grade)}
                            className="hover:bg-theme-primary/5 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-theme-text">
                              {grade.assignmentName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text/70 capitalize">
                              {grade.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text/70">
                              {grade.weight}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={getGradeColor(grade.score)}>
                                {grade.score}/{grade.maxScore}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-theme-text/70">
                              {format(new Date(grade.submittedDate), 'MMM d, yyyy')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedGrade && (
        <div className="fixed inset-0 bg-theme-text/20 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-background rounded-lg shadow-xl max-w-lg w-full p-6 border border-theme-primary/20">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-theme-text">{selectedGrade.assignmentName}</h3>
                <p className="text-sm text-theme-text/70">{selectedGrade.courseCode}</p>
              </div>
              <button
                onClick={() => setSelectedGrade(null)}
                className="text-theme-text/50 hover:text-theme-text transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-theme-text/70">Score</dt>
                <dd className="mt-1 text-sm text-theme-text">
                  <span className={getGradeColor(selectedGrade.score)}>
                    {selectedGrade.score}/{selectedGrade.maxScore} ({(selectedGrade.score / selectedGrade.maxScore * 100).toFixed(1)}%)
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-theme-text/70">Weight</dt>
                <dd className="mt-1 text-sm text-theme-text">{selectedGrade.weight}% of final grade</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-theme-text/70">Submitted</dt>
                <dd className="mt-1 text-sm text-theme-text">
                  {format(new Date(selectedGrade.submittedDate), 'PPP p')}
                </dd>
              </div>

              {selectedGrade.feedback && (
                <div>
                  <dt className="text-sm font-medium text-theme-text/70">Feedback</dt>
                  <dd className="mt-1 text-sm text-theme-text">{selectedGrade.feedback}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
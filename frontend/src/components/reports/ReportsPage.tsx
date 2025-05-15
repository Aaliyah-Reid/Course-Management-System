import React, { useState } from 'react';
import { format } from 'date-fns';
import { BarChart, PieChart, ArrowDownToLine } from 'lucide-react';

interface CourseProgress {
  courseCode: string;
  courseName: string;
  progress: number;
  grade: number;
}

interface ActivityData {
  type: string;
  count: number;
}

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'progress' | 'activity'>('progress');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'semester'>('month');

  // Mock data - replace with actual data from your backend
  const courseProgress: CourseProgress[] = [
    { courseCode: 'CS101', courseName: 'Introduction to Computer Science', progress: 75, grade: 92 },
    { courseCode: 'MATH201', courseName: 'Linear Algebra', progress: 60, grade: 88 },
    { courseCode: 'CS202', courseName: 'Data Structures', progress: 45, grade: 90 },
  ];

  const activityData: ActivityData[] = [
    { type: 'Assignments Submitted', count: 12 },
    { type: 'Forum Posts', count: 8 },
    { type: 'Quizzes Completed', count: 5 },
    { type: 'Course Materials Accessed', count: 25 },
  ];

  const getProgressColor = (progress: number): string => {
    if (progress >= 75) return 'bg-theme-primary';
    if (progress >= 50) return 'bg-theme-secondary';
    return 'bg-theme-accent';
  };

  const downloadReport = () => {
    // Implement report download logic
    console.log('Downloading report...');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-theme-text">Academic Reports</h1>
        <p className="mt-1 text-sm text-theme-text/70">
          View and analyze your academic performance and activity
        </p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setReportType('progress')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              reportType === 'progress'
                ? 'bg-theme-primary/20 text-theme-primary'
                : 'text-theme-text hover:bg-theme-primary/10'
            }`}
          >
            <BarChart className="h-5 w-5 mr-2" />
            Course Progress
          </button>
          <button
            onClick={() => setReportType('activity')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              reportType === 'activity'
                ? 'bg-theme-primary/20 text-theme-primary'
                : 'text-theme-text hover:bg-theme-primary/10'
            }`}
          >
            <PieChart className="h-5 w-5 mr-2" />
            Activity Summary
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
            className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
          </select>

          <button
            onClick={downloadReport}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-theme-secondary rounded-md hover:bg-theme-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-secondary transition-colors"
          >
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      {reportType === 'progress' ? (
        <div className="bg-theme-background rounded-lg shadow overflow-hidden border border-theme-primary/20">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-theme-text mb-4">Course Progress</h3>
            <div className="space-y-4">
              {courseProgress.map((course) => (
                <div key={course.courseCode} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-theme-text">{course.courseName}</h4>
                      <p className="text-sm text-theme-text/70">{course.courseCode}</p>
                    </div>
                    <span className="text-sm font-medium text-theme-text">
                      Grade: {course.grade}%
                    </span>
                  </div>
                  <div className="h-2 bg-theme-primary/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getProgressColor(course.progress)} transition-all duration-300`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-theme-text/70">
                    <span>{course.progress}% Complete</span>
                    <span>{format(new Date(), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-theme-background rounded-lg shadow overflow-hidden border border-theme-primary/20">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-theme-text mb-4">Activity Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {activityData.map((activity) => (
                <div
                  key={activity.type}
                  className="bg-theme-primary/5 rounded-lg p-4 border border-theme-primary/20"
                >
                  <h4 className="text-sm font-medium text-theme-text/70">{activity.type}</h4>
                  <p className="mt-2 text-3xl font-semibold text-theme-text">{activity.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
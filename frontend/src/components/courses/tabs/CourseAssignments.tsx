import React from 'react';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Assignment } from '../../../types/course'; // Assuming Assignment type exists

interface CourseAssignmentsProps {
  courseCode: string;
}

// Helper function to determine assignment status (optional, can be done in component)
const getAssignmentStatus = (dueDate: string): string => {
  const now = new Date();
  const due = new Date(dueDate);
  if (due < now) return 'past due'; // Or 'submitted', 'graded' depending on more data
  // Add more sophisticated logic if needed, e.g., based on submission status
  return 'upcoming';
};

const CourseAssignments: React.FC<CourseAssignmentsProps> = ({ courseCode }) => {
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!courseCode) return;

    const fetchAssignments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/assignments/${courseCode}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // API returns { assignments: [{ assignmentid, content, duedate }] }
        // We need to map this to the frontend Assignment type
        const fetchedAssignments = (data.assignments || []).map((apiAssignment: any) => ({
          id: apiAssignment.assignmentid.toString(),
          courseCode: courseCode, // Already have this from props
          content: apiAssignment.content, // Renamed from title for consistency with DB
          dueDate: apiAssignment.duedate,
        }));
        setAssignments(fetchedAssignments);
        setError(null);
      } catch (e: any) {
        setError(e.message || 'Failed to fetch assignments');
        setAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [courseCode]);

  if (isLoading) {
    return <div className="text-center py-4 text-theme-text">Loading assignments...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error: {error}</div>;
  }

  if (assignments.length === 0) {
    return <div className="text-center py-4 text-theme-text">No assignments found for this course.</div>;
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const status = getAssignmentStatus(assignment.dueDate);
        return (
          <div
            key={assignment.id}
            className="rounded-lg border border-theme-primary/20 bg-theme-background p-6 shadow-sm theme-transition"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-theme-text">{assignment.content}</h3> {/* Changed from assignment.title */}
              <span className={`
                inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                ${status === 'upcoming'
                  ? 'bg-theme-accent/20 text-theme-accent'
                  : 'bg-red-500/20 text-red-500' // Example for past due
                }
              `}>
                {status}
              </span>
            </div>
            <div className="mt-4 flex items-center text-sm text-theme-text/70">
              <CalendarIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-theme-text/50" />
              <span>Due {format(new Date(assignment.dueDate), 'PPP')}</span>
              <ClockIcon className="ml-4 mr-1.5 h-5 w-5 flex-shrink-0 text-theme-text/50" />
              <span>{format(new Date(assignment.dueDate), 'p')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseAssignments;
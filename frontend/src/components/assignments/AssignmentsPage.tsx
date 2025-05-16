import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
// Removed ClockIcon, CheckCircleIcon, XCircleIcon as status is removed
import { UserType } from '../../types/user'; // Assuming UserType is defined here
import { Course } from '../../types/course'; // Assuming Course might be useful, or define a local UserCourse
import SubmissionModal from './SubmissionModal'; // Import the submission modal

// Interface for submission details (can be null if not submitted)
interface SubmissionDetails {
  submissionid: number;
  submissioncontent: string;
  uploaddate: string;
  score?: number | null; // Score can be null or not present
}

// Interface for assignments fetched from the backend
interface BackendAssignment {
  assignmentid: number;
  content: string;
  duedate: string;
}

// Interface for courses fetched for the user
interface UserCourse {
  coursecode: string;
  coursename: string;
}

// Updated interface for assignments displayed in the UI
interface UIAssignment {
  id: number; // assignmentid
  courseCode: string;
  courseName: string; // Added for better display
  content: string;    // assignment_content
  dueDate: string | null;   // assignment_duedate
  submission?: SubmissionDetails | null; // Optional submission details
}

interface AssignmentsPageProps {
  userId: string | null;
  userType: UserType | null; // Allow userType to be null
}

const AssignmentsPage: React.FC<AssignmentsPageProps> = ({ userId, userType }) => {
  const [assignments, setAssignments] = useState<UIAssignment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dueDate' | 'courseCode'>('dueDate');
  // Add state for managing submission modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);

  const fetchAssignmentsForStudent = async () => {
    if (!userId || userType !== UserType.Student) { // Check against UserType.Student and if userId is present
      setAssignments([]);
      // Only set loading to false if it's not a student, to avoid quick flash for students
      if (userType !== UserType.Student) setIsLoading(false); 
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Use the new consolidated endpoint with full URL
      const response = await fetch(`http://localhost:5000/assignments/student/${userId}`); 
      if (!response.ok) {
        let errorText = response.statusText;
        try {
          // Try to get more specific error from JSON response if possible
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch (jsonError) {
          // If response is not JSON, try to get text content
          try {
            errorText = await response.text(); 
          } catch (textError) {
            // Fallback if text content also fails
            errorText = `Request failed with status: ${response.status}`;
          }
        }
        throw new Error(`Failed to fetch assignments: ${errorText}`);
      }
      const data = await response.json();
      
      const fetchedAssignments: UIAssignment[] = (data.student_assignments || []).map((asg: any) => ({
        id: asg.assignmentid,
        courseCode: asg.coursecode,
        courseName: asg.coursename, // Make sure backend provides this
        content: asg.content,
        dueDate: asg.duedate,
        submission: asg.submission ? {
          submissionid: asg.submission.submissionid,
          submissioncontent: asg.submission.submissioncontent,
          uploaddate: asg.submission.uploaddate,
          score: asg.submission.score,
        } : null,
      }));
      setAssignments(fetchedAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignmentsForStudent();
  }, [userId, userType]);

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1; // Sort assignments with no due date to the end
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    // Sort by course name, then by due date for tie-breaking within a course
    const courseCompare = a.courseName.localeCompare(b.courseName);
    if (courseCompare !== 0) return courseCompare;
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  
  const handleOpenSubmitModal = (assignmentId: number, courseCode: string) => {
    setSelectedAssignmentId(assignmentId);
    setSelectedCourseCode(courseCode);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignmentId(null);
    setSelectedCourseCode(null);
  };

  const handleSubmitSuccess = () => {
    // Refresh assignments after successful submission
    fetchAssignmentsForStudent();
  };

  if (userType !== UserType.Student) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-theme-text">This page is for students to view their assignments.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-theme-text">Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-red-500">Error loading assignments: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-theme-text">My Assignments</h1>
          <p className="mt-2 text-sm text-theme-text/70">
            View and manage your course assignments.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-md border-theme-primary bg-theme-background text-theme-text py-1.5 px-3 text-sm focus:border-theme-secondary focus:ring-theme-secondary"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="courseCode">Sort by Course</option> {/* This will now sort by courseName */}
          </select>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            {sortedAssignments.length === 0 && !isLoading ? (
              <p className="text-center text-theme-text/70 py-4">No assignments found.</p>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-theme-primary/20 sm:rounded-lg">
                <table className="min-w-full divide-y divide-theme-primary/20">
                  <thead className="bg-theme-primary/5">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-theme-text sm:pl-6">
                        Assignment Content
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                        Course
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                        Due Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                        Status / Score
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-primary/20 bg-theme-background">
                    {sortedAssignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="whitespace-pre-wrap py-4 pl-4 pr-3 text-sm font-medium text-theme-text sm:pl-6" style={{ maxWidth: '300px', wordWrap: 'break-word' }}>
                          {assignment.content}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                          {assignment.courseName} ({assignment.courseCode})
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                          {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, yyyy h:mm a') : 'N/A'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                          {assignment.submission ? (
                            <>
                              Submitted: {format(new Date(assignment.submission.uploaddate), 'MMM d, yyyy')}
                              {assignment.submission.score !== null && assignment.submission.score !== undefined ? (
                                <span className="ml-2 font-semibold">(Score: {assignment.submission.score})</span>
                              ) : (
                                <span className="ml-2 italic">(Awaiting Grade)</span>
                              )}
                              {/* TODO: Add button to view submission content */}
                            </>
                          ) : (
                            <span className="italic text-yellow-500">Not Submitted</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {!assignment.submission && (
                            <button 
                              onClick={() => handleOpenSubmitModal(assignment.id, assignment.courseCode)}
                              className="text-theme-accent hover:text-theme-accent/80 font-medium theme-transition"
                            >
                              Submit
                            </button>
                          )}
                          {/* TODO: Add view submission button if submitted */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render the submission modal */}
      {isModalOpen && userId && selectedAssignmentId && (
        <SubmissionModal
          assignmentId={selectedAssignmentId}
          courseCode={selectedCourseCode || undefined}
          userId={userId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
};

export default AssignmentsPage;
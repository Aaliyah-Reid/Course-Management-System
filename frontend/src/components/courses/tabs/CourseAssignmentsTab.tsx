import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { UserType } from '../../../types/user'; // Assuming UserType might be needed for future role-specific logic
import SubmissionModal from '../../assignments/SubmissionModal'; // Import the submission modal

// Interface for submission details (can be null if not submitted)
interface SubmissionDetails {
  submissionid: number;
  submissioncontent: string;
  uploaddate: string;
  score?: number | null; 
}

// Interface for assignments displayed in this tab
interface CourseAssignmentUI {
  id: number; // assignmentid
  content: string; // assignment_content
  dueDate: string | null; // assignment_duedate
  submission?: SubmissionDetails | null;
}

interface CourseAssignmentsTabProps {
  courseCode: string;
  userId: string | null;
  userType: UserType | null; // To determine if the user is a student
}

const CourseAssignmentsTab: React.FC<CourseAssignmentsTabProps> = ({ courseCode, userId, userType }) => {
  const [assignments, setAssignments] = useState<CourseAssignmentUI[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Add state for managing submission modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);

  const fetchCourseAssignments = async () => {
    if (!userId || !courseCode || userType !== UserType.Student) {
      setAssignments([]);
      setIsLoading(false);
      if (userType !== UserType.Student) {
          setError('Assignments view is for students only.');
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/assignments/course/${courseCode}/student/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch assignments for course ${courseCode}: ${response.statusText} - ${errorData.error || 'Server error'}`);
      }
      const data = await response.json();
      const fetchedAssignments: CourseAssignmentUI[] = (data.course_assignments || []).map((asg: any) => ({
        id: asg.assignmentid,
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
    fetchCourseAssignments();
  }, [courseCode, userId, userType]);

  // Sort by due date by default
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const handleOpenSubmitModal = (assignmentId: number) => {
    setSelectedAssignmentId(assignmentId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssignmentId(null);
  };

  const handleSubmitSuccess = () => {
    // Refresh assignments after successful submission
    fetchCourseAssignments();
  };

  if (isLoading) {
    return <div className="text-center py-4 text-theme-text">Loading assignments...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-theme-secondary">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-theme-text mb-4">Assignments for {courseCode}</h2>
      {userType !== UserType.Student && (
         <p className="text-theme-text/70 italic">Assignment submission is available for students.</p>
      )}
      {sortedAssignments.length === 0 && userType === UserType.Student && (
        <p className="text-theme-text/70 italic">No assignments found for this course.</p>
      )}
      {userType === UserType.Student && sortedAssignments.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-theme-primary/20">
            <thead className="bg-theme-primary/5">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-theme-text sm:pl-6">Content</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">Due Date</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">Status / Score</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-theme-text">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-primary/20 bg-theme-background">
              {sortedAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="whitespace-pre-wrap py-4 pl-4 pr-3 text-sm font-medium text-theme-text sm:pl-6" style={{ maxWidth: '400px', wordWrap: 'break-word' }}>
                    {assignment.content}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-theme-text/70">
                    {assignment.dueDate ? format(new Date(assignment.dueDate), 'MMM d, yyyy h:mm a') : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {assignment.submission ? (
                      <div>
                        <span className="text-theme-text/70">
                          Submitted: {format(new Date(assignment.submission.uploaddate), 'MMM d, yyyy')}
                        </span>
                        {assignment.submission.score !== null && assignment.submission.score !== undefined ? (
                          <div className="mt-1">
                            <span className="font-semibold">
                              Score: <span className={assignment.submission.score >= 50 ? "text-theme-accent" : "text-theme-secondary"}>
                                {assignment.submission.score}%
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="ml-2 italic text-theme-text/50">(Awaiting Grade)</span>
                        )}
                      </div>
                    ) : (
                      <span className="italic text-theme-primary">Not Submitted</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    {!assignment.submission && (
                      <button 
                        onClick={() => handleOpenSubmitModal(assignment.id)}
                        className="text-theme-accent hover:text-theme-accent/80 font-medium theme-transition"
                      >
                        Submit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Render the submission modal */}
      {isModalOpen && userId && selectedAssignmentId && (
        <SubmissionModal
          assignmentId={selectedAssignmentId}
          courseCode={courseCode}
          userId={userId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmitSuccess={handleSubmitSuccess}
        />
      )}
    </div>
  );
};

export default CourseAssignmentsTab; 
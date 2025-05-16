import React, { useState } from 'react';
import { XIcon } from 'lucide-react';

interface SubmissionModalProps {
  assignmentId: number;
  courseCode?: string; // Optional, might be useful for displaying context
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void; // Callback to refresh assignments after submission
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({ 
  assignmentId, 
  courseCode, 
  userId, 
  isOpen, 
  onClose,
  onSubmitSuccess
}) => {
  const [submissionContent, setSubmissionContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submissionContent.trim()) {
      setError('Please enter your submission content');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('http://134.199.222.77:5000/submit_assignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: userId,
          assignmentId: assignmentId,
          submissionContent: submissionContent
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit assignment');
      }

      // Success! Call the callback to refresh assignments
      onSubmitSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-theme-background rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-primary/10">
          <h3 className="text-lg font-semibold text-theme-text">
            Submit Assignment {courseCode && `for ${courseCode}`}
          </h3>
          <button 
            onClick={onClose}
            className="text-theme-text/50 hover:text-theme-text transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="submissionContent" className="block text-sm font-medium text-theme-text mb-1">
                Your Submission
              </label>
              <textarea
                id="submissionContent"
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-theme-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-theme-secondary/50 bg-theme-background text-theme-text"
                placeholder="Enter your solution or answer here..."
                disabled={isSubmitting}
              />
            </div>
            
            <div className="text-sm text-theme-text/70">
              Note: Once submitted, you cannot edit your submission.
            </div>
          </div>
          
          <div className="px-6 py-4 bg-theme-primary/5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-theme-primary/20 rounded-md text-theme-text hover:bg-theme-primary/10 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-theme-accent text-white rounded-md hover:bg-theme-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmissionModal; 
import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Forum } from '../../types/forum';
import { UserType } from '../../types/user'; // Assuming UserType is available

interface ForumListProps {
  courseCode: string;
  onForumSelect: (forum: Forum) => void;
  userId: string | null; // For potential future use or consistency
  userType: UserType | null; // For potential future use or consistency
}

const ForumList: React.FC<ForumListProps> = ({ courseCode, onForumSelect, userId, userType }) => {
  const [forums, setForums] = useState<Forum[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseCode) return;

    const fetchForums = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://134.199.222.77:5000/forums/${courseCode}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch forums: ${response.statusText}`);
        }
        const data = await response.json();
        // Assuming the API returns { courseCode: string, forums: Forum[] }
        // And Forum type is { forumid: number, forumname: string }
        // We need to map it to our frontend Forum type: { id: number, name: string, courseCode: string }
        const fetchedForums = data.forums.map((f: any) => ({
          id: f.forumid,
          name: f.forumname,
          courseCode: data.courseCode, // Add courseCode to each forum object
        })); 
        setForums(fetchedForums);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setForums([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForums();
  }, [courseCode]);

  if (isLoading) {
    return <p className="text-theme-text text-center py-4">Loading forums...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center py-4">Error loading forums: {error}</p>;
  }

  if (forums.length === 0) {
    return <p className="text-theme-text/70 text-center py-4">No forums found for this course.</p>;
  }

  return (
    <div className="space-y-4">
      {forums.map((forum) => (
        <div
          key={forum.id}
          onClick={() => onForumSelect(forum)}
          className="bg-theme-background rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4 border border-theme-primary/20"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-lg bg-theme-primary/10 flex items-center justify-center">
                <ChatBubbleLeftIcon className="h-6 w-6 text-theme-primary" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-theme-text truncate">
                {forum.name}
              </h3>
              {/* Displaying course code here might be redundant if ForumList is always shown in a course context */}
              {/* <p className="text-sm text-theme-text/70">
                Course Code: {forum.courseCode}
              </p> */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForumList;
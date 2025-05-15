import React from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Forum } from '../../types/forum';

interface ForumListProps {
  forums: Forum[];
  onForumSelect: (forum: Forum) => void;
}

const ForumList: React.FC<ForumListProps> = ({ forums, onForumSelect }) => {
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
              <p className="text-sm text-theme-text/70">
                Course Code: {forum.courseCode}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ForumList;
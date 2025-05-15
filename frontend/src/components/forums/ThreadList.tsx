import React from 'react';
import { format } from 'date-fns';
import { Thread } from '../../types/forum';
import { ChatBubbleOvalLeftIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ThreadListProps {
  threads: Thread[];
  forumName: string;
  onThreadSelect: (thread: Thread) => void;
  onBack: () => void;
  onVote: (threadId: number, value: 1 | -1) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  forumName,
  onThreadSelect,
  onBack,
  onVote,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-theme-text hover:text-theme-primary transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Forums
        </button>
        <h2 className="text-2xl font-bold text-theme-text">{forumName}</h2>
      </div>

      {threads.map((thread) => (
        <div
          key={thread.id}
          className="bg-theme-background rounded-lg shadow hover:shadow-md transition-shadow border border-theme-primary/20"
        >
          <div className="flex p-4">
            <div className="flex flex-col items-center mr-4 space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(thread.id, 1);
                }}
                className={`p-1 rounded hover:bg-theme-primary/10 ${
                  thread.userVote === 1 ? 'text-theme-accent' : 'text-theme-text/50'
                } transition-colors`}
              >
                <ArrowUpIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-theme-text">{thread.voteCount}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(thread.id, -1);
                }}
                className={`p-1 rounded hover:bg-theme-primary/10 ${
                  thread.userVote === -1 ? 'text-theme-secondary' : 'text-theme-text/50'
                } transition-colors`}
              >
                <ArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div
              className="flex-1 cursor-pointer"
              onClick={() => onThreadSelect(thread)}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-theme-primary/10 flex items-center justify-center">
                  {thread.createdBy.avatar ? (
                    <img src={thread.createdBy.avatar} alt={thread.createdBy.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-theme-primary">
                      {thread.createdBy.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-sm text-theme-text/70">
                  Posted by {thread.createdBy.name} • {format(new Date(thread.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-theme-text mb-2">
                {thread.title}
              </h3>
              
              <p className="text-sm text-theme-text/70 line-clamp-2">
                {thread.content}
              </p>
              
              <div className="mt-4 flex items-center text-sm text-theme-text/70">
                <ChatBubbleOvalLeftIcon className="h-5 w-5 mr-1" />
                {thread.replyCount} {thread.replyCount === 1 ? 'comment' : 'comments'}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThreadList;
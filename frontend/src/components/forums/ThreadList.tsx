import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Thread, Forum } from '../../types/forum';
import { User } from '../../types/user';
import { ChatBubbleOvalLeftIcon, ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ThreadListProps {
  forum: Forum;
  currentUser: User | null;
  onThreadSelect: (thread: Thread) => void;
  onBack: () => void;
}

const fetchUserDetails = async (userId: string | number, firstName?: string, lastName?: string): Promise<{ id: string | number; name: string; avatar?: string }> => {
  if (firstName && lastName) {
    return {
      id: userId,
      name: `${firstName} ${lastName}`,
      avatar: undefined,
    };
  }
  
  return {
    id: userId,
    name: `User ${userId}`,
    avatar: undefined,
  };
};

const ThreadList: React.FC<ThreadListProps> = ({
  forum,
  currentUser,
  onThreadSelect,
  onBack,
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!forum || !forum.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/threads/${forum.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch threads: ${response.statusText}`);
      }
      const data = await response.json();
      
      const threadsWithUserDetails = await Promise.all(
        data.threads.map(async (apiThread: any) => {
          const userDetails = await fetchUserDetails(
            apiThread.createdby, 
            apiThread.firstname, 
            apiThread.lastname
          );
          return {
            id: apiThread.threadid,
            title: apiThread.threadtitle,
            content: apiThread.content,
            createdBy: {
              id: userDetails.id.toString(),
              name: userDetails.name,
              avatar: userDetails.avatar,
            },
            createdAt: apiThread.createdat,
            voteCount: apiThread.votes,
          };
        })
      );
      setThreads(threadsWithUserDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setThreads([]);
    } finally {
      setIsLoading(false);
    }
  }, [forum]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleVote = async (threadId: number, vote: 1 | -1) => {
    if (!currentUser || !currentUser.id) {
      alert('You must be logged in to vote.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/vote/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: threadId, userId: currentUser.id, vote: vote }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }
      fetchThreads();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error submitting vote');
    }
  };

  if (isLoading) {
    return <p className="text-theme-text text-center py-4">Loading threads...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center py-4">Error loading threads: {error}</p>;
  }

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
        <h2 className="text-2xl font-bold text-theme-text">{forum.name}</h2>
      </div>

      {threads.length === 0 && <p className='text-center text-theme-text/70'>No threads found in this forum.</p>}

      {threads.map((thread) => (
        <div
          key={thread.id}
          className="bg-theme-background rounded-lg shadow hover:shadow-md transition-shadow border border-theme-primary/20"
        >
          <div className="flex p-4">
            <div className="flex flex-col items-center mr-4 space-y-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote(thread.id, 1);
                }}
                className={`p-1 rounded hover:bg-theme-primary/10 ${
                  thread.userVote === 1 ? 'text-theme-accent' : 'text-theme-text/50'
                } transition-colors`}
                disabled={!currentUser}
              >
                <ArrowUpIcon className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-theme-text">{thread.voteCount}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleVote(thread.id, -1);
                }}
                className={`p-1 rounded hover:bg-theme-primary/10 ${
                  thread.userVote === -1 ? 'text-theme-secondary' : 'text-theme-text/50'
                } transition-colors`}
                disabled={!currentUser}
              >
                <ArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div
              className="flex-1 cursor-pointer min-w-0"
              onClick={() => onThreadSelect(thread)}
            >
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-theme-primary/10 flex items-center justify-center flex-shrink-0">
                  {thread.createdBy.avatar ? (
                    <img src={thread.createdBy.avatar} alt={thread.createdBy.name} className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-theme-primary">
                      {thread.createdBy.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-theme-text/70 truncate">
                  Posted by {thread.createdBy.name} • {format(new Date(thread.createdAt), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              
              <h3 className="text-lg font-medium text-theme-text mb-2 truncate">
                {thread.title}
              </h3>
              
              <p className="text-sm text-theme-text/70 line-clamp-2">
                {thread.content}
              </p>
              
              {thread.replyCount !== undefined && (
                 <div className="mt-4 flex items-center text-sm text-theme-text/70">
                   <ChatBubbleOvalLeftIcon className="h-5 w-5 mr-1" />
                   {thread.replyCount} {thread.replyCount === 1 ? 'comment' : 'comments'}
                 </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThreadList;
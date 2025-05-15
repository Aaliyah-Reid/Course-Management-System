import React, { useState } from 'react';
import ForumList from './ForumList';
import ThreadList from './ThreadList';
import ThreadView from './ThreadView';
import { Forum, Thread, Reply } from '../../types/forum';

// Mock data - replace with actual data from your backend
const mockForums: Forum[] = [
  { id: 1, courseCode: 'CS101', name: 'General Discussion' },
  { id: 2, courseCode: 'CS101', name: 'Assignment Help' },
];

const mockThreads: Thread[] = [
  {
    id: 1,
    forumId: 1,
    title: 'Welcome to the Course',
    content: 'Welcome everyone! Use this space to introduce yourself.',
    createdBy: {
      id: 1,
      name: 'John Smith',
      avatar: null,
    },
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    voteCount: 42,
    userVote: null,
    replyCount: 2,
  },
];

const mockReplies: Reply[] = [
  {
    id: 1,
    threadId: 1,
    parentReplyId: null,
    content: 'Hello everyone! Looking forward to learning with you all.',
    createdBy: {
      id: 2,
      name: 'Jane Doe',
      avatar: null,
    },
    createdAt: '2024-03-15T12:00:00Z',
    voteCount: 15,
    userVote: null,
    replies: [
      {
        id: 2,
        threadId: 1,
        parentReplyId: 1,
        content: 'Welcome to the course!',
        createdBy: {
          id: 3,
          name: 'Alice Johnson',
          avatar: null,
        },
        createdAt: '2024-03-15T12:30:00Z',
        voteCount: 8,
        userVote: null,
        replies: [],
      },
    ],
  },
];

type View = 'forums' | { type: 'threads'; forum: Forum } | { type: 'thread'; thread: Thread };

const ForumPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('forums');
  const [threads, setThreads] = useState(mockThreads);
  const [replies, setReplies] = useState(mockReplies);

  const handleForumSelect = (forum: Forum) => {
    setCurrentView({ type: 'threads', forum });
  };

  const handleThreadSelect = (thread: Thread) => {
    setCurrentView({ type: 'thread', thread });
  };

  const handleBack = () => {
    if (typeof currentView === 'string') return;
    setCurrentView(currentView.type === 'threads' ? 'forums' : { 
      type: 'threads', 
      forum: mockForums.find(f => f.id === (currentView.thread as Thread).forumId)! 
    });
  };

  const handleReply = (content: string, parentReplyId?: number) => {
    // Implement reply logic here
    console.log('Reply:', { content, parentReplyId });
  };

  const handleVote = (type: 'thread' | 'reply', id: number, value: 1 | -1) => {
    if (type === 'thread') {
      setThreads(threads.map(thread => {
        if (thread.id === id) {
          const oldValue = thread.userVote || 0;
          const newValue = oldValue === value ? 0 : value;
          return {
            ...thread,
            voteCount: thread.voteCount - oldValue + newValue,
            userVote: newValue || null,
          };
        }
        return thread;
      }));
    } else {
      const updateReplyVotes = (replyList: Reply[]): Reply[] => {
        return replyList.map(reply => {
          if (reply.id === id) {
            const oldValue = reply.userVote || 0;
            const newValue = oldValue === value ? 0 : value;
            return {
              ...reply,
              voteCount: reply.voteCount - oldValue + newValue,
              userVote: newValue || null,
            };
          }
          return {
            ...reply,
            replies: updateReplyVotes(reply.replies),
          };
        });
      };
      
      setReplies(updateReplyVotes(replies));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-theme-background theme-transition">
      {currentView === 'forums' ? (
        <ForumList forums={mockForums} onForumSelect={handleForumSelect} />
      ) : currentView.type === 'threads' ? (
        <ThreadList
          threads={threads.filter(t => t.forumId === currentView.forum.id)}
          forumName={currentView.forum.name}
          onThreadSelect={handleThreadSelect}
          onBack={handleBack}
          onVote={(threadId, value) => handleVote('thread', threadId, value)}
        />
      ) : (
        <ThreadView
          thread={currentView.thread}
          replies={replies}
          onBack={handleBack}
          onReply={handleReply}
          onVote={handleVote}
        />
      )}
    </div>
  );
};

export default ForumPage;
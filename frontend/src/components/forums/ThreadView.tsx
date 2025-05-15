import React, { useState } from 'react';
import { format } from 'date-fns';
import { Thread, Reply } from '../../types/forum';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface ThreadViewProps {
  thread: Thread;
  replies: Reply[];
  onBack: () => void;
  onReply: (content: string, parentReplyId?: number) => void;
  onVote: (type: 'thread' | 'reply', id: number, value: 1 | -1) => void;
}

const ReplyComponent: React.FC<Reply & { 
  onReply: (replyId: number) => void;
  onVote: (id: number, value: 1 | -1) => void;
}> = ({ 
  id, content, createdBy, createdAt, replies = [], voteCount, userVote, onReply, onVote
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleVote = (value: 1 | -1) => {
    if (userVote === value) {
      onVote(id, 0);
    } else {
      onVote(id, value);
    }
  };

  return (
    <div className="border-l-2 border-theme-primary/20 pl-4 ml-4 mt-4">
      <div className="bg-theme-background rounded-lg p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={() => handleVote(1)}
              className={`p-1 rounded hover:bg-theme-primary/10 ${
                userVote === 1 ? 'text-theme-accent' : 'text-theme-text/50'
              } transition-colors`}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-theme-text">{voteCount}</span>
            <button
              onClick={() => handleVote(-1)}
              className={`p-1 rounded hover:bg-theme-primary/10 ${
                userVote === -1 ? 'text-theme-secondary' : 'text-theme-text/50'
              } transition-colors`}
            >
              <ArrowDownIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-theme-primary/10 flex items-center justify-center">
                {createdBy.avatar ? (
                  <img src={createdBy.avatar} alt={createdBy.name} className="h-8 w-8 rounded-full" />
                ) : (
                  <span className="text-sm font-medium text-theme-primary">
                    {createdBy.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="text-sm">
                <span className="font-medium text-theme-text">{createdBy.name}</span>
                <span className="text-theme-text/50 mx-2">•</span>
                <span className="text-theme-text/70">{format(new Date(createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            <div className="mt-2 text-theme-text prose-sm">{content}</div>
            
            <div className="mt-2 flex items-center space-x-4 text-sm">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-theme-text/70 hover:text-theme-text transition-colors"
              >
                Reply
              </button>
            </div>

            {isReplying && (
              <div className="mt-4">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="w-full min-h-[100px] p-3 border border-theme-primary/20 rounded-lg bg-theme-background text-theme-text placeholder:text-theme-text/50 focus:ring-2 focus:ring-theme-secondary focus:border-transparent"
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                    className="px-3 py-1 text-sm text-theme-text/70 hover:text-theme-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onReply(id);
                      setIsReplying(false);
                      setReplyContent('');
                    }}
                    disabled={!replyContent.trim()}
                    className="px-3 py-1 text-sm bg-theme-secondary text-white rounded hover:bg-theme-secondary/90 disabled:opacity-50 transition-colors"
                  >
                    Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {replies.map((reply) => (
        <ReplyComponent key={reply.id} {...reply} onReply={onReply} onVote={onVote} />
      ))}
    </div>
  );
};

const ThreadView: React.FC<ThreadViewProps> = ({ thread, replies, onBack, onReply, onVote }) => {
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(replyContent);
      setReplyContent('');
    }
  };

  const handleThreadVote = (value: 1 | -1) => {
    if (thread.userVote === value) {
      onVote('thread', thread.id, 0);
    } else {
      onVote('thread', thread.id, value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="flex items-center text-theme-text hover:text-theme-primary transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Threads
        </button>
      </div>

      <div className="bg-theme-background rounded-lg shadow-sm p-6 border border-theme-primary/20">
        <div className="flex items-start space-x-4">
          <div className="flex flex-col items-center space-y-1">
            <button
              onClick={() => handleThreadVote(1)}
              className={`p-1 rounded hover:bg-theme-primary/10 ${
                thread.userVote === 1 ? 'text-theme-accent' : 'text-theme-text/50'
              } transition-colors`}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-theme-text">{thread.voteCount}</span>
            <button
              onClick={() => handleThreadVote(-1)}
              className={`p-1 rounded hover:bg-theme-primary/10 ${
                thread.userVote === -1 ? 'text-theme-secondary' : 'text-theme-text/50'
              } transition-colors`}
            >
              <ArrowDownIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-theme-primary/10 flex items-center justify-center">
                {thread.createdBy.avatar ? (
                  <img src={thread.createdBy.avatar} alt={thread.createdBy.name} className="h-10 w-10 rounded-full" />
                ) : (
                  <span className="text-lg font-medium text-theme-primary">
                    {thread.createdBy.name.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-theme-text">{thread.title}</h1>
                <div className="text-sm text-theme-text/70">
                  Posted by {thread.createdBy.name} • {format(new Date(thread.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="prose max-w-none text-theme-text">{thread.content}</div>
          </div>
        </div>
      </div>

      <div className="bg-theme-background rounded-lg shadow-sm p-4 border border-theme-primary/20">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Write a comment..."
          className="w-full min-h-[100px] p-3 border border-theme-primary/20 rounded-lg bg-theme-background text-theme-text placeholder:text-theme-text/50 focus:ring-2 focus:ring-theme-secondary focus:border-transparent"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmitReply}
            disabled={!replyContent.trim()}
            className="px-4 py-2 bg-theme-secondary text-white rounded-md hover:bg-theme-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Comment
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {replies.map((reply) => (
          <ReplyComponent
            key={reply.id}
            {...reply}
            onReply={(replyId) => onReply(replyContent, replyId)}
            onVote={(id, value) => onVote('reply', id, value)}
          />
        ))}
      </div>
    </div>
  );
};

export default ThreadView;
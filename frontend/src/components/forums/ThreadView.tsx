import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Thread, Reply as ReplyTypeDefinition } from '../../types/forum';
import { User } from '../../types/user';
import { ArrowLeftIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

// NOTES ON ReplyTypeDefinition and Thread from types/forum.ts & User from types/user.ts:
// ReplyTypeDefinition.createdBy.id is assumed to be number.
// User.id is assumed to be string | number. When posting, it will be converted to number if needed.

interface ThreadViewProps {
  initialThread: Thread;
  currentUser: User | null;
  onBack: () => void;
}

// Mock user details fetch. In a real app, this would hit an API.
// Assumes that the ID for a user in the UserStub (part of Reply/Thread) is a number.
const fetchUserStubDetails = async (userId: number, firstName?: string, lastName?: string): Promise<{ id: number; name: string; avatar?: string }> => {
  // If firstname and lastname are provided, use them
  if (firstName && lastName) {
    return { id: userId, name: `${firstName} ${lastName}`, avatar: undefined };
  }
  
  // Fallback to old behavior
  return { id: userId, name: `User ${userId}`, avatar: undefined };
};

const processApiReply = async (apiReply: any, threadId: number): Promise<ReplyTypeDefinition> => {
  // Backend 'createdby' is a number (UserID)
  const userDetails = await fetchUserStubDetails(
    apiReply.createdby as number,
    apiReply.firstname,
    apiReply.lastname
  );
  
  const processedChildren = apiReply.children && apiReply.children.length > 0 
    ? await Promise.all(apiReply.children.map((child: any) => processApiReply(child, threadId)))
    : [];

  return {
    id: apiReply.replyid as number,
    threadId: threadId,
    parentReplyId: apiReply.parentreplyid as number | null,
    content: apiReply.content as string,
    createdBy: {
      id: userDetails.id, // number, from fetchUserStubDetails
      name: userDetails.name,
      avatar: userDetails.avatar,
    },
    createdAt: apiReply.replydate as string,
    voteCount: apiReply.votes as number,
    replies: processedChildren,
    userVote: undefined, // Placeholder, would need separate fetch for current user's vote on this reply
  } as ReplyTypeDefinition; // Cast assumes ReplyTypeDefinition matches this structure
};

interface ReplyComponentProps {
  reply: ReplyTypeDefinition;
  depth: number;
  currentUserIdAsNumber: number | null;
  onReplySubmit: (content: string, parentReplyId: number) => Promise<void>; 
  onVoteSubmit: (replyId: number, vote: 1 | -1) => Promise<void>;
}

const ReplyComponent: React.FC<ReplyComponentProps> = ({ 
  reply,
  depth,
  currentUserIdAsNumber,
  onReplySubmit,
  onVoteSubmit
}) => {
  const { id, content, createdBy, createdAt, replies = [], voteCount, userVote } = reply;
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLocalReplySubmit = async () => {
    if (!replyContent.trim() || !currentUserIdAsNumber) return;
    await onReplySubmit(replyContent, id);
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <div className={`ml-${Math.min(depth * 3, 9)} mt-3`}> {/* Adjusted indent */}
      <div className={`bg-theme-background rounded-md p-2.5 shadow-sm border border-theme-primary/${depth === 0 ? '20' : '10'}`}>
        <div className="flex items-start space-x-2.5">
          <div className="flex flex-col items-center mr-1.5 space-y-0.5 flex-shrink-0 mt-0.5">
            <button
              onClick={() => currentUserIdAsNumber && onVoteSubmit(id, 1)}
              className={`p-0.5 rounded hover:bg-theme-primary/10 ${
                userVote === 1 ? 'text-theme-accent' : 'text-theme-text/40'
              } transition-colors`} disabled={!currentUserIdAsNumber}
            >
              <ArrowUpIcon className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-medium text-theme-text">{voteCount}</span>
            <button
              onClick={() => currentUserIdAsNumber && onVoteSubmit(id, -1)}
              className={`p-0.5 rounded hover:bg-theme-primary/10 ${
                userVote === -1 ? 'text-theme-secondary' : 'text-theme-text/40'
              } transition-colors`} disabled={!currentUserIdAsNumber}
            >
              <ArrowDownIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <div className="h-6 w-6 rounded-full bg-theme-primary/10 flex items-center justify-center flex-shrink-0">
                {createdBy.avatar ? (
                  <img src={createdBy.avatar} alt={createdBy.name} className="h-6 w-6 rounded-full" />
                ) : (
                  <span className="text-xs font-medium text-theme-primary">
                    {createdBy.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="text-xs">
                <span className="font-medium text-theme-text">{createdBy.name}</span>
                <span className="text-theme-text/50 mx-1">•</span>
                <span className="text-theme-text/70">{format(new Date(createdAt), 'MMM d, yy HH:mm')}</span>
              </div>
            </div>
            <div className="mt-1 text-sm text-theme-text prose-sm break-words leading-relaxed">{content}</div>
            <div className="mt-1 flex items-center space-x-3 text-xs">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-theme-text/60 hover:text-theme-text transition-colors font-medium"
                disabled={!currentUserIdAsNumber}
              >
                Reply
              </button>
            </div>
            {isReplying && currentUserIdAsNumber && (
              <div className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Replying to ${createdBy.name}...`}
                  rows={2}
                  className="w-full p-1.5 border border-theme-primary/20 rounded-md bg-theme-background text-sm text-theme-text placeholder:text-theme-text/50 focus:ring-1 focus:ring-theme-secondary focus:border-transparent"
                />
                <div className="mt-1 flex justify-end space-x-1.5">
                  <button
                    onClick={() => { setIsReplying(false); setReplyContent(''); }}
                    className="px-2 py-0.5 text-xs text-theme-text/70 hover:text-theme-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLocalReplySubmit}
                    disabled={!replyContent.trim()}
                    className="px-2 py-0.5 text-xs bg-theme-secondary text-white rounded hover:bg-theme-secondary/90 disabled:opacity-50 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {replies.map((childReply) => (
        <ReplyComponent key={childReply.id} reply={childReply} depth={depth + 1} currentUserIdAsNumber={currentUserIdAsNumber} onReplySubmit={onReplySubmit} onVoteSubmit={onVoteSubmit} />
      ))}
    </div>
  );
};

const ThreadView: React.FC<ThreadViewProps> = ({ initialThread, currentUser, onBack }) => {
  const [thread, setThread] = useState<Thread>(initialThread);
  const [replies, setReplies] = useState<ReplyTypeDefinition[]>([]);
  const [isLoadingReplies, setIsLoadingReplies] = useState<boolean>(false);
  const [errorReplies, setErrorReplies] = useState<string | null>(null);
  const [newReplyContent, setNewReplyContent] = useState('');

  // Ensure currentUser.id is parsed as number if it's string for backend consistency
  const currentUserIdAsNumber = currentUser?.id ? (typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id) : null;

  const fetchReplies = useCallback(async () => {
    if (!thread?.id) return;
    setIsLoadingReplies(true);
    setErrorReplies(null);
    try {
      const response = await fetch(`http://134.199.222.77:5000/thread/${thread.id}/replies`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); 
        throw new Error(errorData.error || `Failed to fetch replies: ${response.statusText}`);
      }
      const data = await response.json();
      const processedReplies = await Promise.all(data.replies.map((apiReply: any) => processApiReply(apiReply, thread.id)));
      setReplies(processedReplies);
    } catch (err) {
      setErrorReplies(err instanceof Error ? err.message : 'An unknown error occurred while fetching replies.');
      setReplies([]);
    } finally {
      setIsLoadingReplies(false);
    }
  }, [thread?.id]);

  useEffect(() => { if (thread?.id) fetchReplies(); }, [thread?.id, fetchReplies]);
  useEffect(() => { setThread(initialThread); }, [initialThread]);

  const handleVote = async (type: 'thread' | 'reply', id: number, vote: 1 | -1) => {
    if (!currentUserIdAsNumber) { alert('You must be logged in to vote.'); return; }
    const endpoint = type === 'thread' ? 'http://134.199.222.77:5000/vote/thread' : 'http://134.199.222.77:5000/vote/reply';
    const payload = type === 'thread' ? { threadId: id, userId: currentUserIdAsNumber, vote } : { replyId: id, userId: currentUserIdAsNumber, vote };
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.error || 'Failed to submit vote'); }
      if (type === 'thread') {
        setThread(prev => {
          if (!prev) return prev as any;
          const currentVoteStatus = prev.userVote;
          let newVoteCount = prev.voteCount;
          if (currentVoteStatus === vote) { newVoteCount -= vote; return { ...prev, voteCount: newVoteCount, userVote: undefined }; }
          else { newVoteCount += vote; if (currentVoteStatus) newVoteCount -= currentVoteStatus; return { ...prev, voteCount: newVoteCount, userVote: vote }; }
        });
      } else { fetchReplies(); }
    } catch (err) { alert(err instanceof Error ? err.message : 'Error submitting vote'); }
  };

  const handlePostReply = async (content: string, parentReplyId?: number) => {
    if (!currentUserIdAsNumber || !thread?.id) { alert('User not logged in or thread ID missing. Cannot post reply.'); return; }
    try {
      const response = await fetch('http://134.199.222.77:5000/reply_thread', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.id, parentReplyId: parentReplyId || null, content, createdBy: currentUserIdAsNumber }),
      });
      if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.error || 'Failed to post reply'); }
      fetchReplies();
      if (!parentReplyId) setNewReplyContent('');
    } catch (err) { alert(err instanceof Error ? err.message : 'Error posting reply'); }
  };

  if (!thread) return <p className="text-red-500 text-center py-4">Thread data is missing or invalid.</p>;

  const countAllReplies = (replyList: ReplyTypeDefinition[]): number => replyList.reduce((acc, r) => acc + 1 + (r.replies ? countAllReplies(r.replies) : 0), 0);
  const totalRepliesCount = countAllReplies(replies);

  return (
    <div className="space-y-5">
      <div className="flex items-center space-x-3">
        <button onClick={onBack} className="flex items-center text-sm text-theme-text/80 hover:text-theme-primary transition-colors p-1 rounded hover:bg-theme-primary/10">
          <ArrowLeftIcon className="h-4.5 w-4.5 mr-1" /> Back to Threads
        </button>
      </div>
      <div className="bg-theme-background rounded-lg shadow-sm p-4 sm:p-5 border border-theme-primary/20">
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex flex-col items-center mr-2 sm:mr-3 space-y-1 flex-shrink-0 mt-0.5">
            <button onClick={() => handleVote('thread', thread.id, 1)} className={`p-1 rounded hover:bg-theme-primary/10 ${thread.userVote === 1 ? 'text-theme-accent' : 'text-theme-text/50'} transition-colors`} disabled={!currentUser}><ArrowUpIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" /></button>
            <span className="text-sm font-medium text-theme-text">{thread.voteCount}</span>
            <button onClick={() => handleVote('thread', thread.id, -1)} className={`p-1 rounded hover:bg-theme-primary/10 ${thread.userVote === -1 ? 'text-theme-secondary' : 'text-theme-text/50'} transition-colors`} disabled={!currentUser}><ArrowDownIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" /></button>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-theme-primary/10 flex items-center justify-center flex-shrink-0">
                {thread.createdBy.avatar ? <img src={thread.createdBy.avatar} alt={thread.createdBy.name} className="h-9 w-9 sm:h-10 sm:w-10 rounded-full" /> : <span className="text-sm sm:text-base font-medium text-theme-primary">{thread.createdBy.name.charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-theme-text leading-tight break-words">{thread.title}</h1>
                <div className="text-xs text-theme-text/70 mt-0.5">Posted by {thread.createdBy.name} • {format(new Date(thread.createdAt), 'MMM d, yyyy HH:mm')}</div>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-theme-text break-words text-sm sm:text-base leading-relaxed"><div>{thread.content}</div></div>
          </div>
        </div>
      </div>
      {currentUser && (
        <div className="bg-theme-background rounded-lg shadow-sm p-3.5 sm:p-4 border border-theme-primary/20">
          <h4 className="text-sm font-medium text-theme-text mb-1.5">Leave a comment</h4>
          <textarea value={newReplyContent} onChange={(e) => setNewReplyContent(e.target.value)} placeholder="Write a comment..." rows={3} className="w-full p-2.5 border border-theme-primary/20 rounded-lg bg-theme-background text-theme-text placeholder:text-theme-text/50 focus:ring-1 focus:ring-theme-secondary focus:border-transparent text-sm" />
          <div className="mt-2.5 flex justify-end">
            <button onClick={() => handlePostReply(newReplyContent)} disabled={!newReplyContent.trim() || !currentUser} className="px-3.5 py-1.5 text-sm bg-theme-secondary text-white rounded-md hover:bg-theme-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Post Comment</button>
          </div>
        </div>
      )}
      <div className="space-y-0.5">
        <h3 className="text-md sm:text-lg font-semibold text-theme-text mb-2.5 pt-2">
          {isLoadingReplies ? 'Loading comments...' : `${totalRepliesCount} Comment${totalRepliesCount === 1 ? '' : 's'}`}
        </h3>
        {errorReplies && <p className="text-red-500 text-center py-3">Error loading comments: {errorReplies}</p>}
        {!isLoadingReplies && !errorReplies && replies.length === 0 && <p className="text-theme-text/70 text-center py-3">No comments yet. Be the first to reply!</p>}
        {replies.map((replyData) => <ReplyComponent key={replyData.id} reply={replyData} depth={0} currentUserIdAsNumber={currentUserIdAsNumber} onReplySubmit={handlePostReply} onVoteSubmit={(replyId, vote) => handleVote('reply', replyId, vote)} /> )}
      </div>
    </div>
  );
};

export default ThreadView;
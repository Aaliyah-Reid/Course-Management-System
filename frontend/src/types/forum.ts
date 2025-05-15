export interface Forum {
  id: number;
  courseCode: string;
  name: string;
}

export interface Thread {
  id: number;
  forumId: number;
  title: string;
  content: string;
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  voteCount: number;
  userVote?: 1 | -1 | null;
  replyCount: number;
}

export interface Reply {
  id: number;
  threadId: number;
  parentReplyId: number | null;
  content: string;
  createdBy: {
    id: number;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  voteCount: number;
  userVote?: 1 | -1 | null;
  replies: Reply[];
}

export interface Vote {
  id: number;
  userId: number;
  value: 1 | -1;
}
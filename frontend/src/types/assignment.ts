export interface Assignment {
  id: number;
  courseCode: string;
  title: string;
  content: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
}

export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string;
  uploadDate: string;
  score?: number;
  feedback?: string;
}
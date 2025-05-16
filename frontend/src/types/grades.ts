export interface Grade {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  assignmentId: string;
  assignmentName: string;
  type: 'assignment' | 'quiz' | 'exam' | 'project';
  score: number;
  maxScore: number;
  weight: number;
  submittedDate: string;
  feedback?: string;
}

export interface CourseGrade {
  courseId: string;
  courseName: string;
  courseCode: string;
  grades: Grade[];
  overallGrade: number;
}
export interface StudentGrade {
  coursecode: string;
  coursename: string;
  assignmentid: number;
  assignmentcontent: string | null;
  assignmentduedate: string | null; // Assuming ISO date string
  submissionid: number | null;
  submissioncontent: string | null;
  submissiondate: string | null; // Assuming ISO date string
  score: number | null;
}

export interface LecturerGradeEntry extends StudentGrade {
  studentid: number | null;
  studentfirstname: string | null;
  studentlastname: string | null;
}

// Data structure from API for student
export interface StudentGradesResponse {
  studentGrades: StudentGrade[];
}

// Data structure from API for lecturer
export interface LecturerGradesResponse {
  lecturerCourseGrades: LecturerGradeEntry[];
} 
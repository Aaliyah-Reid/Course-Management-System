export interface Course {
  coursecode: string;
  coursename: string;
  lecturerName?: string;
}

export interface Section {
  id: string;
  courseCode: string;
  title: string;
  items: SectionItem[];
}

export interface SectionItem {
  id: string;
  sectionId: string;
  title: string;
  link?: string;
  filename?: string;
  description?: string;
  type: string;
}

export interface Assignment {
  id: string;
  courseCode: string;
  content: string;
  dueDate: string;
}

export interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'lecturer' | 'admin';
}

export interface Announcement {
  id: string;
  courseCode: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

// You can add other course-related types here if needed
// For example, if you have a more detailed Course type elsewhere:
// export interface CourseDetail extends Course {
//   description?: string;
//   lecturerId?: string;
//   adminId?: string;
// }
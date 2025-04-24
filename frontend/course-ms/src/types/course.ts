export interface Course {
  id: string;
  name: string;
  code: string;
  lastAccessed: string;
}

export interface Section {
  id: string;
  courseCode: string;
  title: string;
}

export interface SectionItem {
  id: string;
  sectionId: string;
  title: string;
  link?: string;
  filename?: string;
  description?: string;
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
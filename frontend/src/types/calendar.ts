export interface CalendarEvent {
  id: number;
  title: string;
  courseCode: string;
  date: string;
  type: 'assignment' | 'quiz' | 'exam';
  description?: string;
  location?: string;
  duration?: number; // in minutes
}

export interface CalendarFilter {
  courseCode: string | 'all';
  type: 'all' | 'assignment' | 'quiz' | 'exam';
  timeframe: 'day' | 'week' | 'month';
}
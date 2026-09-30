export interface Entry {
  id?: string;
  category: string;
  date: string;
  hours: string | number;
  therapist: string;
  learningGoal: string;
  notes: string;
  courseId: string;
}

export interface TimeEntry {
  id?: string;
  studentId: string;
  category: string;
  date: string;
  hours: string | number;
  therapist: string;
  learningGoal: string;
  notes: string;
  courseId: string;
}

export type EntryFormValues = Entry;
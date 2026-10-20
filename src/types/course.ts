export interface Course {
  id: string;
  key: string;
  label: string;
  startYear: number;
  programId: string;
  createdByUserId?: string | null;
}

export type CourseMap = Record<string, Course>;

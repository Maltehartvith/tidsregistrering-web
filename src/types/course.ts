export interface Course {
  id: string;
  key: string;
  label: string;
  startYear: number;
  programId: string;
}

export type CourseMap = Record<string, Course>;

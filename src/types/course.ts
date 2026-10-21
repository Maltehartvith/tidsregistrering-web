export interface Course {
  id: string;
  key: string;
  label: string;
  startYear: number;
  educationId: string;
  targets: Record<string, number>;
  createdByUserId?: string | null;
}

export type CourseMap = Record<string, Course>;

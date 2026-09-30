export interface Course {
  id: string;
  label: string;
  startYear: number;
  programId: string;
  targets: Record<string, number>;
}

export type CourseMap = Record<string, Course>;

export interface CourseLink {
  courseId: string;
  included: boolean;
}

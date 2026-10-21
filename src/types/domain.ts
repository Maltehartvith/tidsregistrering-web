export interface Category {
  id: string;
  key: string;
  label: string;
  short: string;
  defaultTarget: number;
  color: string;
  soft: string;
  requiresTherapist: boolean;
  archived?: boolean;
}

export type CategoriesMap = Record<string, Category>;

export interface Education {
  id: string;
  key: string;
  name: string;
  location?: string | null;
  year?: number | null;
  targets: Record<string, number>;
  createdByUserId?: string | null;
}

export interface EducationDraft {
  name: string;
  location: string;
  year: string;
  targets: Record<string, number>;
}
export type EducationsMap = Record<string, Education>;

export interface AuditEvent {
  id: string;
  at: Date;
  actor: string;
  userId: string | null;
  courseId: string | null;
  description: string;
}
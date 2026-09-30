export interface Category {
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

export interface Program {
  id: string;
  name: string;
  targets: Record<string, number>;
}

export interface ProgramDraft {
  name: string;
  targets: Record<string, number>;
}
export type ProgramsMap = Record<string, Program>;

export interface AuditEvent {
  id: string;
  at: Date;
  actor: string;
  studentId: string | null;
  courseId: string | null;
  description: string;
}

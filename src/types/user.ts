import { CourseLink } from "./course";

export type AdminRoleKey = "administrator" | "underviser";

export interface AdminRoleMeta {
  key: AdminRoleKey;
  label: string;
  description: string;
}

export type UserStatus = "active" | "invited";

export interface Student {
    id: string;
    name: string;
    email: string;
    courseId: string;
    courseLinks: CourseLink[];
  }

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRoleKey;
  allCourses: boolean;
  courseIds: string[];
  status: UserStatus;
}

export type UserRole = "kursist" | "underviser" | "administrator";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  studentId?: string | null;
}

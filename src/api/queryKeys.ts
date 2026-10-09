import type { UserRole } from "../types/user";
import { routes } from "../routes.ts";

export const queryKeys = {
  me: ["auth", "me"] as const,
  branding: ["branding"] as const,
  categories: ["categories"] as const,
  learningGoals: ["learningGoals"] as const,
  programs: ["programs"] as const,
  courses: ["courses"] as const,
  students: ["students"] as const,
  entries: ["entries"] as const,
  users: ["users"] as const,
};

/** Domain keys cleared on logout (everything except auth). */
export const domainQueryKeys = [
  queryKeys.branding,
  queryKeys.categories,
  queryKeys.learningGoals,
  queryKeys.programs,
  queryKeys.courses,
  queryKeys.students,
  queryKeys.entries,
  queryKeys.users,
] as const;

export const STAFF_ROLES: UserRole[] = ["underviser", "administrator"];
export const ALL_AUTH_ROLES: UserRole[] = [
  "kursist",
  "underviser",
  "administrator",
];

export function isStaffRole(role: UserRole | undefined | null): boolean {
  return role === "underviser" || role === "administrator";
}

export function homeForRole(role: UserRole): string {
  return isStaffRole(role) ? routes.adminStudents : routes.studentOverview;
}

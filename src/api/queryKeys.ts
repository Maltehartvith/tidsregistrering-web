import type { UserRole } from "../types/user";
import { routes } from "../routes.ts";

export const queryKeys = {
  me: ["auth", "me"] as const,
  bootstrap: ["bootstrap"] as const,
};

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
  return isStaffRole(role) ? routes.adminStudents : routes.student;
}

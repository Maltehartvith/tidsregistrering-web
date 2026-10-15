export type AdminRoleKey = "administrator" | "underviser";

export interface AdminRoleMeta {
  key: AdminRoleKey;
  label: string;
  description: string;
}

export type UserStatus = "active" | "invited";

export type UserRole = "kursist" | "underviser" | "administrator";

/** Hours registered for one category on one of the user's courses. */
export interface UserCourseCategory {
  id: string;
  short: string;
  hours: number;
}

/** A course assigned to a user (enrollment for kursist, access for staff). */
export interface UserCourse {
  id: string;
  active: boolean;
  included: boolean;
  categories: UserCourseCategory[];
}

/** Payload for POST/PATCH /users — categories/hours are server-owned. */
export type UserCourseWrite = {
  id: string;
  active: boolean;
  included?: boolean;
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  status: UserStatus;
  allCourses: boolean;
  courses: UserCourse[];
}

import type {
  AdminRoleKey,
  User,
  UserCourseWrite,
  UserRole,
  UserStatus,
} from "../types/user";
import { request } from "./request";

export type CreatedUser = User & {
  inviteToken?: string;
  mailPreview?: boolean;
};

export async function listUsers(role?: UserRole): Promise<User[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  return request<User[]>(`/users${query}`);
}

export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  allCourses?: boolean;
  courses?: UserCourseWrite[];
  password?: string;
}): Promise<CreatedUser> {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createKursist(input: {
  name: string;
  email: string;
  courses: UserCourseWrite[];
}): Promise<User> {
  return createUser({
    name: input.name,
    email: input.email,
    role: "kursist",
    courses: input.courses,
  });
}

export async function resendInvite(
  id: string,
): Promise<{ ok: boolean; inviteToken?: string; mailPreview?: boolean }> {
  return request(`/users/${encodeURIComponent(id)}/resend-invite`, {
    method: "POST",
  });
}

export async function updateUser(
  id: string,
  input: Partial<{
    name: string;
    email: string;
    role: AdminRoleKey | UserRole;
    allCourses: boolean;
    courses: UserCourseWrite[];
    status: UserStatus;
    password: string;
  }>,
): Promise<User> {
  return request<User>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

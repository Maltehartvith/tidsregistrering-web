import type { AdminUser, AdminRoleKey, UserStatus } from "../types/user";
import { request } from "./request";

export async function listUsers(): Promise<AdminUser[]> {
  return request<AdminUser[]>("/users");
}

export async function createUser(input: {
  name: string;
  email: string;
  role: AdminRoleKey;
  allCourses?: boolean;
  courseIds?: string[];
  password?: string;
  status?: UserStatus;
}): Promise<AdminUser & { inviteToken?: string; mailPreview?: boolean }> {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(input),
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
    role: AdminRoleKey;
    allCourses: boolean;
    courseIds: string[];
    status: UserStatus;
    password: string;
  }>,
): Promise<AdminUser> {
  return request<AdminUser>(`/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await request(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
}

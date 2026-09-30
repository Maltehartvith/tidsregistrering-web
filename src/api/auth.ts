import type { SessionUser } from "../types/user";
import { request } from "./request";

export async function getMe(): Promise<SessionUser | null> {
  try {
    return await request<SessionUser>("/auth/me");
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string,
  rememberMe = true,
): Promise<SessionUser> {
  return request<SessionUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
}

export async function forgotPassword(
  email: string,
): Promise<{ ok: boolean; token?: string }> {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ ok: boolean }> {
  return request("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export type InvitePreview = {
  name: string;
  email: string;
  role: string;
  orgName: string;
  appTitle: string;
};

export async function getInvite(token: string): Promise<InvitePreview> {
  return request<InvitePreview>(`/auth/invite/${encodeURIComponent(token)}`);
}

export async function acceptInvite(input: {
  token: string;
  name: string;
  password: string;
}): Promise<SessionUser> {
  return request<SessionUser>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

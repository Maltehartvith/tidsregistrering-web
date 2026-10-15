import type { User } from "../types/user";
import { ApiError, request } from "./request";
import { clearToken, readToken, storeToken } from "./token";

type AuthResponse = {
  token: string;
  user: User;
};

export async function getMe(): Promise<User | null> {
  if (!readToken()) return null;
  try {
    return await request<User>("/auth/me");
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      clearToken();
    }
    return null;
  }
}

export async function login(
  email: string,
  password: string,
  rememberMe = true,
): Promise<User> {
  const session = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  storeToken(session.token, rememberMe);
  return session.user;
}

export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    clearToken();
  }
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
}): Promise<User> {
  const session = await request<AuthResponse>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
  storeToken(session.token, true);
  return session.user;
}

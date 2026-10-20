import type { User } from "../types/user";
import { ApiError, request } from "./request";

export type OrganizationChoice = {
  id: string;
  name: string;
};

type LoginPayload = {
  user?: User;
  chooseOrganization?: boolean;
  selectionToken?: string;
  organizations?: OrganizationChoice[];
};

export type LoginResult =
  | { status: "signed-in"; user: User }
  | {
      status: "choose-organization";
      selectionToken: string;
      organizations: OrganizationChoice[];
    };

function readLogin(payload: LoginPayload): LoginResult {
  if (payload.chooseOrganization) {
    if (!payload.selectionToken || !payload.organizations?.length) {
      throw new ApiError("Kunne ikke vælge organisation.", 500);
    }
    return {
      status: "choose-organization",
      selectionToken: payload.selectionToken,
      organizations: payload.organizations,
    };
  }
  if (!payload.user) throw new ApiError("Kunne ikke logge ind.", 500);
  return { status: "signed-in", user: payload.user };
}

export async function getMe(): Promise<User | null> {
  try {
    return await request<User>("/auth/me");
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      return null;
    }
    return null;
  }
}

export async function login(
  email: string,
  password: string,
  rememberMe = false,
): Promise<LoginResult> {
  const session = await request<LoginPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, rememberMe }),
  });
  return readLogin(session);
}

export async function selectOrganization(
  selectionToken: string,
  organizationId: string,
): Promise<User> {
  const session = await request<LoginPayload>("/auth/select-organization", {
    method: "POST",
    body: JSON.stringify({ selectionToken, organizationId }),
  });
  const result = readLogin(session);
  if (result.status !== "signed-in") {
    throw new ApiError("Kunne ikke vælge organisation.", 500);
  }
  return result.user;
}

export async function logout(): Promise<void> {
  await request("/auth/logout", { method: "POST" });
}

export async function forgotPassword(email: string): Promise<{ ok: boolean }> {
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
  const session = await request<LoginPayload>("/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const result = readLogin(session);
  if (result.status !== "signed-in") {
    throw new ApiError("Kunne ikke fuldføre invitationen.", 500);
  }
  return result.user;
}

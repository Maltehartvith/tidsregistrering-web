import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AdminUser, AdminRoleKey, UserStatus } from "../types/user";
import { useAuth } from "./AuthContext";
import { useRefreshBootstrap } from "../api/refresh";
import * as usersApi from "../api/users";

export interface UsersContextValue {
  adminUsers: AdminUser[];
  setAdminUsers: Dispatch<SetStateAction<AdminUser[]>>;
  createUser: (input: {
    name: string;
    email: string;
    role: AdminRoleKey;
    allCourses?: boolean;
    courseIds?: string[];
    password?: string;
    status?: UserStatus;
  }) => Promise<AdminUser & { inviteToken?: string; mailPreview?: boolean }>;
  updateUser: (
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
  ) => Promise<AdminUser>;
  deleteUser: (id: string) => Promise<void>;
  resendInvite: (
    id: string,
  ) => Promise<{ ok: boolean; inviteToken?: string; mailPreview?: boolean }>;
}

const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({
  adminUsers,
  setAdminUsers,
  children,
}: {
  adminUsers: AdminUser[];
  setAdminUsers: Dispatch<SetStateAction<AdminUser[]>>;
  children: ReactNode;
}) {
  const { demoMode } = useAuth();
  const refresh = useRefreshBootstrap();

  const createUser = useCallback(
    async (input: {
      name: string;
      email: string;
      role: AdminRoleKey;
      allCourses?: boolean;
      courseIds?: string[];
      password?: string;
      status?: UserStatus;
    }) => {
      if (demoMode) {
        const created: AdminUser = {
          id: `u${Date.now().toString(36)}`,
          name: input.name,
          email: input.email,
          role: input.role,
          allCourses: Boolean(input.allCourses),
          courseIds: input.courseIds || [],
          status: input.status || "invited",
        };
        setAdminUsers((prev) => [...prev, created]);
        return created;
      }
      const created = await usersApi.createUser(input);
      await refresh();
      return created;
    },
    [demoMode, refresh, setAdminUsers],
  );

  const updateUser = useCallback(
    async (
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
    ) => {
      if (demoMode) {
        let updated: AdminUser | undefined;
        setAdminUsers((prev) =>
          prev.map((u) => {
            if (u.id !== id) return u;
            updated = { ...u, ...input };
            return updated;
          }),
        );
        return updated!;
      }
      const updated = await usersApi.updateUser(id, input);
      await refresh();
      return updated;
    },
    [demoMode, refresh, setAdminUsers],
  );

  const deleteUserFn = useCallback(
    async (id: string) => {
      if (demoMode) {
        setAdminUsers((prev) => prev.filter((u) => u.id !== id));
        return;
      }
      await usersApi.deleteUser(id);
      await refresh();
    },
    [demoMode, refresh, setAdminUsers],
  );

  const resendInvite = useCallback(
    async (id: string) => {
      if (demoMode) {
        return { ok: true, mailPreview: true, inviteToken: "demo" };
      }
      return usersApi.resendInvite(id);
    },
    [demoMode],
  );

  return (
    <UsersContext.Provider
      value={{
        adminUsers,
        setAdminUsers,
        createUser,
        updateUser,
        deleteUser: deleteUserFn,
        resendInvite,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsers must be used within UsersProvider");
  }
  return ctx;
}

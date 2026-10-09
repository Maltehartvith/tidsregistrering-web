import {
  createContext,
  useContext,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AdminUser, AdminRoleKey, UserStatus } from "../types/user";
import {
  useCreateUser,
  useDeleteUser,
  useResendInvite,
  useUpdateUser,
  useUsersQuery,
  useUsersSetter,
} from "../hooks/users";

export interface UsersContextValue {
  adminUsers: AdminUser[];
  isLoading: boolean;
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

export function UsersProvider({ children }: { children: ReactNode }) {
  const { data: adminUsers, isLoading } = useUsersQuery();
  const setAdminUsers = useUsersSetter();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const resendMutation = useResendInvite();

  return (
    <UsersContext.Provider
      value={{
        adminUsers,
        isLoading,
        setAdminUsers,
        createUser: (input) => createMutation.mutateAsync(input),
        updateUser: (id, input) => updateMutation.mutateAsync({ id, input }),
        deleteUser: (id) => deleteMutation.mutateAsync(id),
        resendInvite: (id) => resendMutation.mutateAsync(id),
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
